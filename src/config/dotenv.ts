import path from 'path'
import dotenv from 'dotenv'

// Carga .env desde la raíz del proyecto (no depende del directorio de trabajo actual).
const pathToEnv = path.resolve(__dirname, '..', '..', '.env')
dotenv.config({ path: pathToEnv })

