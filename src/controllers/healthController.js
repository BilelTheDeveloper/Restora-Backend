import mongoose from 'mongoose';
import os from 'os';
import { success } from '../utils/apiResponse.js';

export const getHealth = async (req, res, next) => {
  try {
    const start = Date.now();

    // Check DB
    let dbStatus = 'up';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await mongoose.connection.db.command({ ping: 1 });
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'down';
    }

    // Memory
    const totalMem  = os.totalmem();
    const freeMem   = os.freemem();
    const usedMem   = totalMem - freeMem;
    const memPct    = Math.round((usedMem / totalMem) * 100);

    // Process memory (Node heap)
    const heapUsed  = process.memoryUsage().heapUsed;
    const heapTotal = process.memoryUsage().heapTotal;

    // Uptime
    const uptimeSec   = Math.floor(process.uptime());
    const uptimeDays  = Math.floor(uptimeSec / 86400);
    const uptimeHours = Math.floor((uptimeSec % 86400) / 3600);
    const uptimeMins  = Math.floor((uptimeSec % 3600) / 60);

    // Overall status
    const overallStatus = dbStatus === 'down' ? 'degraded' : 'healthy';

    success(res, {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - start,
      services: {
        database: {
          status:  dbStatus,
          latency: dbLatency,
          name:    mongoose.connection.name || 'restora',
        },
        api: {
          status:  'up',
          latency: Date.now() - start,
        },
      },
      system: {
        memory: {
          total:      Math.round(totalMem / 1024 / 1024),
          used:       Math.round(usedMem  / 1024 / 1024),
          free:       Math.round(freeMem  / 1024 / 1024),
          percentage: memPct,
        },
        heap: {
          used:  Math.round(heapUsed  / 1024 / 1024),
          total: Math.round(heapTotal / 1024 / 1024),
        },
        uptime: {
          seconds: uptimeSec,
          human:   `${uptimeDays}d ${uptimeHours}h ${uptimeMins}m`,
        },
        platform:    os.platform(),
        nodeVersion: process.version,
        cpuCount:    os.cpus().length,
        loadAvg:     os.loadavg().map(n => Math.round(n * 100) / 100),
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    next(err);
  }
};
