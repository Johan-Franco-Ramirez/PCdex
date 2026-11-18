import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { type Database } from './domain.js';

export class JsonRepository {
    private queue: Promise<unknown> = Promise.resolve();
    constructor(readonly directory = path.resolve(process.env.DATA_DIR ?? 'data')) { }
    private get file() { return path.join(this.directory, 'pcdex.json'); }
    private async read(): Promise<Database> { try {
        const data = JSON.parse(await readFile(this.file, 'utf8')) as Database;
        if (data.version !== 1 || !Array.isArray(data.components) || !Array.isArray(data.builds))
            throw new Error('Formato de persistencia inválido.');
        return data;
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
            throw error;
        const data: Database = { version: 1, components: [], builds: [] };
        await this.write(data);
        return data;
    } }
    private async write(data: Database) { await mkdir(this.directory, { recursive: true }); const temp = `${this.file}.${randomUUID()}.tmp`; await writeFile(temp, JSON.stringify(data, null, 2), 'utf8'); await rename(temp, this.file); }
    private serial<T>(fn: () => Promise<T>): Promise<T> { const next = this.queue.then(fn); this.queue = next.catch(() => undefined); return next; }
    snapshot() { return this.serial(() => this.read()); }
    mutate<T>(fn: (data: Database) => T) { return this.serial(async () => { const data = await this.read(); const result = fn(data); await this.write(data); return result; }); }
    seed() { return this.mutate(data => ({ added: 0, total: data.components.length })); }
}
