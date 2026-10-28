import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Project, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { STARTER_PROJECTS } from '../examples/starterTemplates'

interface CodeSpaceDB extends DBSchema {
  projects: {
    key: string
    value: Project
    indexes: { 'by-updated': number }
  }
  meta: {
    key: string
    value: unknown
  }
}

const DB_NAME = 'codespace_storage'
const DB_VERSION = 1

class StorageService {
  private dbPromise: Promise<IDBPDatabase<CodeSpaceDB>>

  constructor() {
    this.dbPromise = openDB<CodeSpaceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' })
          store.createIndex('by-updated', 'updatedAt')
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta')
        }
      },
    })
  }

  public async getAllProjects(): Promise<Project[]> {
    const db = await this.dbPromise
    const projects = await db.getAll('projects')
    if (projects.length === 0) {
      // Seed default projects for each language
      for (const proj of Object.values(STARTER_PROJECTS)) {
        await db.put('projects', proj)
      }
      return Object.values(STARTER_PROJECTS)
    }
    return projects.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  public async getProject(id: string): Promise<Project | undefined> {
    const db = await this.dbPromise
    return db.get('projects', id)
  }

  public async saveProject(project: Project): Promise<void> {
    const db = await this.dbPromise
    project.updatedAt = Date.now()
    await db.put('projects', project)
    await this.setLastActiveProjectId(project.id)
  }

  public async deleteProject(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('projects', id)
  }

  public async getLastActiveProjectId(): Promise<string | null> {
    const db = await this.dbPromise
    const val = await db.get('meta', 'lastActiveProjectId')
    return typeof val === 'string' ? val : null
  }

  public async setLastActiveProjectId(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.put('meta', id, 'lastActiveProjectId')
  }

  public async getSettings(): Promise<Settings> {
    const db = await this.dbPromise
    const saved = await db.get('meta', 'settings')
    if (saved && typeof saved === 'object') {
      return { ...DEFAULT_SETTINGS, ...(saved as Settings) }
    }
    return DEFAULT_SETTINGS
  }

  public async saveSettings(settings: Settings): Promise<void> {
    const db = await this.dbPromise
    await db.put('meta', settings, 'settings')
  }
}

export const storageService = new StorageService()
