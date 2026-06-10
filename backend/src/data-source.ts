import { DataSource } from 'typeorm'
import { User } from './entity/User'
import { Cattle } from './entity/Cattle'
import { CattleNote } from './entity/CattleNote'
import { BreedingRecord } from './entity/BreedingRecord'
import { BreedingNote } from './entity/BreedingNote'

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: true,
  logging: false,
  entities: [User, Cattle, CattleNote, BreedingRecord, BreedingNote],
  migrations: [],
  subscribers: [],
})