/**
 * Zogotech Database Connection
 * Singleton pool pattern for mssql connection to on-premise SQL Server
 * Reads password from getSetting('zogotech_db_password')
 * Server: zogotech.siskiyous.edu (on-premise, VPN required from Vercel)
 */

import * as sql from 'mssql';
import { getSetting } from './settings';

let pool: sql.ConnectionPool | null = null;
let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  // Return existing pool if available
  if (pool) {
    return pool;
  }

  // Return pending promise if connection is in progress
  if (poolPromise) {
    return poolPromise;
  }

  // Create new pool
  poolPromise = (async () => {
    try {
      const password = await getSetting('zogotech_db_password');
      if (!password) {
        throw new Error('Zogotech DB password not configured. Set ZOGOTECH_DB_PASSWORD env var or configure in Settings.');
      }

      const server = await getSetting('zogotech_db_server');
      const user = await getSetting('zogotech_db_user');

      const config: sql.config = {
        server: server || 'zogotech.siskiyous.edu',
        database: 'Zogotech',
        user: user || 'jtarantino',
        password,
        pool: {
          max: 10,
          min: 2,
          idleTimeoutMillis: 30000,
        },
        options: {
          trustServerCertificate: true,
          encrypt: false,
          instanceName: undefined,
        },
      };

      const newPool = new sql.ConnectionPool(config);
      await newPool.connect();
      pool = newPool;

      // Log connection success (no sensitive data)
      console.log('✓ Connected to Zogotech database');

      return pool;
    } catch (error) {
      poolPromise = null;
      throw error;
    }
  })();

  return poolPromise;
}

export async function runQuery(sqlQuery: string, params?: Record<string, any>): Promise<any[]> {
  try {
    const connPool = await getPool();
    const request = connPool.request();

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
    }

    const result = await request.query(sqlQuery);
    return result.recordset || [];
  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    poolPromise = null;
  }
}
