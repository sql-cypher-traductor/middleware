export interface DbConnection {
  id: string;
  alias: string;
  engine: string;
  host: string;
  username: string;
  port: string;
  db_name: string;
}
