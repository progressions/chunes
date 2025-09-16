// Session management

const fs = require('fs-extra');
const path = require('path');

class SessionManager {
    constructor() {
        this.sessionsDir = 'sessions';
        this.currentSessionDir = null;
    }

    async saveSession(app) {
        try {
            // Create session directory
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.currentSessionDir = path.join(this.sessionsDir, timestamp);
            await fs.ensureDir(this.currentSessionDir);

            // Save session data
            const sessionData = {
                timestamp: new Date().toISOString(),
                parameters: app.parameters,
                musicState: app.musicGenerator.getState(),
                bufferStats: app.bufferManager.getBufferStats()
            };

            const sessionPath = path.join(this.currentSessionDir, 'session.json');
            await fs.writeJson(sessionPath, sessionData, { spaces: 2 });

            // Save timeline
            const timelinePath = path.join(this.currentSessionDir, 'timeline.json');
            await fs.writeJson(timelinePath, app.bufferManager.timeline, { spaces: 2 });

            // Save last session reference
            const lastSessionPath = path.join(this.sessionsDir, 'last_session.json');
            await fs.writeJson(lastSessionPath, {
                sessionDir: this.currentSessionDir,
                timestamp: new Date().toISOString()
            });

            return this.currentSessionDir;
        } catch (error) {
            console.error('Failed to save session:', error);
            return null;
        }
    }

    async restoreSession(app) {
        try {
            const lastSessionPath = path.join(this.sessionsDir, 'last_session.json');

            if (await fs.pathExists(lastSessionPath)) {
                const lastSession = await fs.readJson(lastSessionPath);
                const sessionPath = path.join(lastSession.sessionDir, 'session.json');

                if (await fs.pathExists(sessionPath)) {
                    const sessionData = await fs.readJson(sessionPath);

                    // Restore parameters
                    app.parameters = sessionData.parameters;

                    // Restore music state
                    if (sessionData.musicState) {
                        app.musicGenerator.loadState(sessionData.musicState);
                    }

                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to restore session:', error);
        }

        return false;
    }

    async listSessions() {
        await fs.ensureDir(this.sessionsDir);
        const dirs = await fs.readdir(this.sessionsDir);
        const sessions = [];

        for (const dir of dirs) {
            const sessionPath = path.join(this.sessionsDir, dir, 'session.json');
            if (await fs.pathExists(sessionPath)) {
                const session = await fs.readJson(sessionPath);
                sessions.push({
                    directory: dir,
                    ...session
                });
            }
        }

        return sessions.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    async cleanOldSessions(keepCount = 10) {
        const sessions = await this.listSessions();

        if (sessions.length > keepCount) {
            const toDelete = sessions.slice(keepCount);

            for (const session of toDelete) {
                const sessionDir = path.join(this.sessionsDir, session.directory);
                await fs.remove(sessionDir);
            }
        }
    }
}

module.exports = {
    SessionManager
};