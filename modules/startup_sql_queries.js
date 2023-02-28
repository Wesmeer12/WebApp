'use-strict';
module.exports = async function(database_pool){
  /* Function used to run SQL requests that must be runned on startup ( to create or update the database schem ) */

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS servers ( \
    server_id varchar(32) PRIMARY KEY NOT NULL, \
    name varchar(64) NOT NULL \
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS users (\
      user_id varchar(32) PRIMARY KEY NOT NULL,\
      token BYTEA NOT NULL,\
      refresh_token BYTEA NOT NULL,\
      salt varchar(16) NOT NULL,\
      username varchar(64) NOT NULL,\
      avatar varchar(64),\
      last_login timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),\
      creation_date timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),\
      admin_permissions bigint\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS server_workspace (\
      workspace_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      server_id varchar(32),\
      xml text,\
      creation_date timestamp DEFAULT (CURRENT_TIMESTAMP),\
      CONSTRAINT fk_workspace_server FOREIGN KEY (server_id) REFERENCES servers (server_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS server_code (\
      code_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      server_id varchar(32),\
      action_type varchar(32) NOT NULL,\
      code text NOT NULL,\
      active boolean NOT NULL DEFAULT true,\
      CONSTRAINT fk_server_code_server FOREIGN KEY (server_id) REFERENCES servers (server_id)\
    );;"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS audit_log_actions (\
      audit_action_id int PRIMARY KEY,\
      action varchar(32) NOT NULL\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS audit_log (\
      audit_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      server_id varchar(32),\
      user_id varchar(32),\
      action int NOT NULL,\
      action_date timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),\
      staff_action boolean DEFAULT false,\
      CONSTRAINT fk_audit_log_server FOREIGN KEY (server_id) REFERENCES servers (server_id),\
      CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) REFERENCES users (user_id),\
      CONSTRAINT fk_audit_log_action FOREIGN KEY (action) REFERENCES audit_log_actions (audit_action_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS error_code (\
      id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      message varchar(256) NOT NULL\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS error_message (\
      code_error_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      message_content_id int NOT NULL,\
      server_id varchar(32),\
      sent_date timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),\
      CONSTRAINT fk_error_message_code FOREIGN KEY (message_content_id) REFERENCES error_code (id),\
      CONSTRAINT fk_error_message_server FOREIGN KEY (server_id) REFERENCES servers (server_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS user_ban (\
      ban_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      user_id varchar(32) NOT NULL,\
      reason varchar(256),\
      active boolean NOT NULL DEFAULT true,\
      staff varchar(32),\
      start_date timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),\
      CONSTRAINT fk_user_ban_user FOREIGN KEY (user_id) REFERENCES users (user_id),\
      CONSTRAINT fk_user_ban_staff FOREIGN KEY (staff) REFERENCES users (user_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS server_ban (\
      ban_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      server_id varchar(32) NOT NULL,\
      reason varchar(256),\
      active boolean NOT NULL DEFAULT true,\
      staff varchar(32),\
      start_date timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),\
      CONSTRAINT fk_server_ban_server FOREIGN KEY (server_id) REFERENCES servers (server_id),\
      CONSTRAINT fk_server_ban_staff FOREIGN KEY (staff) REFERENCES users (user_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS premium_code (\
      code varchar(32) PRIMARY KEY NOT NULL,\
      duration int,\
      expire_date timestamp,\
      active boolean NOT NULL DEFAULT true\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS premium (\
      premium_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      start_date timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),\
      end_date timestamp,\
      user_id varchar(32) NOT NULL,\
      server_id varchar(32) DEFAULT null,\
      premium_code varchar(32) DEFAULT null,\
      CONSTRAINT fk_premium_user FOREIGN KEY (user_id) REFERENCES users (user_id),\
      CONSTRAINT fk_premium_server FOREIGN KEY (server_id) REFERENCES servers (server_id),\
      CONSTRAINT fk_premium_code FOREIGN KEY (premium_code) REFERENCES premium_code (code)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS data_storage (\
      storage_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      server_id varchar(32),\
      storage_is_int boolean NOT NULL DEFAULT false,\
      storage_name varchar(32) NOT NULL,\
      CONSTRAINT fk_data_storage_server FOREIGN KEY (server_id) REFERENCES servers (server_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS stored_data (\
      data_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      storage_id int NOT NULL,\
      data_key varchar(32) NOT NULL,\
      data varchar(256),\
      CONSTRAINT fk_stored_data_storage FOREIGN KEY (storage_id) REFERENCES data_storage (storage_id),\
      CONSTRAINT u_names UNIQUE(storage_id, data_key)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS commands (\
      command_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      server_id varchar(32) NOT NULL,\
      name varchar(32) NOT NULL,\
      description varchar(128),\
      code text NOT NULL,\
      ephemeral boolean NOT NULL DEFAULT true,\
      defined boolean NOT NULL DEFAULT false,\
      active boolean NOT NULL DEFAULT true,\
      CONSTRAINT fk_commands_server FOREIGN KEY (server_id) REFERENCES servers (server_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS commands_args (\
      arg_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      command_id bigint NOT NULL,\
      name varchar(32) NOT NULL,\
      description varchar(128),\
      required boolean DEFAULT true,\
      type int NOT NULL,\
      CONSTRAINT fk_commands_args_command FOREIGN KEY (command_id) REFERENCES commands (command_id)\
    );"
  );

  await database_pool.query(
    "CREATE TABLE IF NOT EXISTS news (\
      news_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\
      sent_date timestamp DEFAULT (CURRENT_TIMESTAMP),\
      message text NOT NULL,\
      title varchar(128) NOT NULL\
    );"
  );

  await database_pool.query("CREATE INDEX IF NOT EXISTS i_workspace_server ON server_workspace (server_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_server_code_server ON server_code (server_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_audit_log_server ON audit_log (server_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_error_message_server ON error_message (server_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_user_ban_user ON user_ban (user_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_server_ban_server ON server_ban (server_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_premium_server ON premium (server_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_premium_user ON premium (user_id);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_data_storage_server_and_storage ON data_storage (server_id, storage_name);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_stored_data_storage_and_data ON stored_data (storage_id, data_key);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_commands_server_and_name ON commands (server_id, name);");
  await database_pool.query("CREATE INDEX IF NOT EXISTS i_commands_args_command_id ON commands_args (command_id);");

  /*
  Function used to update datas storages for a server
  First, the function check that the server exists
  Then, we check that storage names starts with S or I ( String or Integer ) and insert new storages that doesn't exists in database
  Finally, every storage not passed as arg of this function is deleted. Data first, then storages themselves.
  */
  await database_pool.query("CREATE OR REPLACE FUNCTION f_update_data_storages_for_guild(f_serverid servers.server_id%TYPE, VARIADIC f_storagesNames VARCHAR[] DEFAULT ARRAY[]::VARCHAR[]) \
  RETURNS VOID \
  LANGUAGE PLPGSQL \
  AS $$ \
  DECLARE \
    v_server_exists INTEGER; \
    v_current_storage_name VARCHAR; \
  BEGIN \
    SELECT COUNT(*) INTO v_server_exists \
    FROM servers \
    WHERE server_id = f_serverid; \
    IF v_server_exists = 0 THEN \
      RAISE EXCEPTION 'Server with id % does not exist', f_serverid; \
    END IF; \
    FOREACH v_current_storage_name IN ARRAY f_storagesNames LOOP \
      IF v_current_storage_name NOT SIMILAR TO '(S|I)%' THEN \
        RAISE EXCEPTION 'Invalid storage name: %', v_current_storage_name; \
      END IF; \
      IF NOT EXISTS ( \
        SELECT 1 \
        FROM data_storage \
        WHERE server_id = f_serverid \
          AND storage_name = v_current_storage_name \
      ) THEN \
        INSERT INTO data_storage (server_id, storage_name, storage_is_int) \
        VALUES (f_serverid, v_current_storage_name, v_current_storage_name SIMILAR TO 'I%'); \
      END IF; \
    END LOOP; \
    DELETE FROM stored_data \
    WHERE storage_id IN ( \
      SELECT storage_id \
      FROM data_storage \
      WHERE server_id = f_serverid \
        AND storage_name NOT IN ( \
          SELECT * FROM UNNEST(f_storagesNames) \
        ));\
    DELETE FROM data_storage \
    WHERE server_id = f_serverid \
      AND storage_name NOT IN (SELECT * FROM UNNEST(f_storagesNames)); \
  END; \
  $$;");

  /*
  This function is used to manage stored data.
  First, we delete the old var to avoid getting an error from the UNIQUE counstraint
  Then, we can add a new row, and save the new value for the variable
  */
  await database_pool.query(
    "CREATE OR REPLACE FUNCTION f_insert_or_update_data(f_serverid servers.server_id%TYPE, f_storage_name data_storage.storage_name%TYPE, f_data_key stored_data.data_key%TYPE, f_data stored_data.data%TYPE)\
    RETURNS VOID AS $$\
    BEGIN\
    DELETE FROM stored_data\
    WHERE storage_id = (SELECT storage_id FROM data_storage WHERE server_id = f_serverid AND storage_name = f_storage_name)\
    AND data_key = f_data_key;\
    \
    INSERT INTO stored_data (storage_id, data_key, data) VALUES (\
    (SELECT storage_id FROM data_storage WHERE server_id = f_serverid AND storage_name = f_storage_name), f_data_key, f_data);\
    END;\
    $$ LANGUAGE plpgsql;"
  );

  await database_pool.query("INSERT INTO audit_log_actions VALUES (1, 'Updated Workspace'), (2, 'Rollbacked Workspace'), (3, 'Made this server Premium'), (4, 'Removed Premium') ON CONFLICT DO NOTHING;");
}
