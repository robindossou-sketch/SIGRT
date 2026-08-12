-- SIGRT – schéma initial (à connecter au SGBD choisi)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  login VARCHAR(100) NOT NULL UNIQUE,
  role VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(150) NOT NULL,
  event_date TIMESTAMP NOT NULL,
  result VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
