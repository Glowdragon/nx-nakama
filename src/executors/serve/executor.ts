import { ServeExecutorSchema } from "./schema"
import { spawn } from "child_process"
import { ExecutorContext, workspaceRoot } from "@nx/devkit"
import { createAsyncIterable } from "@nx/devkit/src/utils/async-iterable"
import * as path from "path"
import { compileTypeScript, copyConfigFile } from "../../utils/build"
import { installPackages } from "../../utils/package-manager"
import { remove } from "fs-extra"
import { directoryExists, listFiles } from "@nx/plugin/testing"
import { executeCommand } from "../../utils/exec"
import { getDatabaseAddresses } from "../../utils/nakama"

export default async function* runExecutor(options: ServeExecutorSchema, context: ExecutorContext) {
  const { configFileName, migrateDatabase } = options
  const projectRoot = context.projectGraph.nodes[context.projectName].data.root
  const outputPath = path.join("tmp", "nakama", context.projectName)

  // Install packages if necessary
  if (!directoryExists(path.join(projectRoot, "node_modules"))) {
    await installPackages(projectRoot)
  }

  // Compile TypeScript and copy config file
  await compileTypeScript(projectRoot, outputPath)
  copyConfigFile(projectRoot, outputPath, configFileName)

  const configFile = path.join(projectRoot, configFileName)
  const databaseAddresses = await getDatabaseAddresses(configFile)
  if (databaseAddresses.length === 0) {
    console.warn(`No database configured in ${configFile}`)
  }

  if (migrateDatabase && databaseAddresses.length > 0) {
    console.log("Migrating databases...")
    for (const databaseAddress of databaseAddresses) {
      await executeCommand(
        `nakama migrate up --database.address ${databaseAddress}`,
        path.join(workspaceRoot, outputPath)
      )
    }
  }

  yield* createAsyncIterable<{ success: boolean }>(async ({ done, next, error }) => {
    const serverProcess = spawn("nakama", ["--config " + configFileName], {
      cwd: path.join(workspaceRoot, outputPath),
      shell: true,
      stdio: "inherit",
    })

    serverProcess.once("exit", (code) => {
      if (code === 0) {
        done()
      } else {
        error(new Error(`Nakama server exited with code ${code}`))
      }
    })

    const killServer = () => {
      if (serverProcess.connected) {
        serverProcess.kill("SIGTERM")
      }

      // Remove temporary files
      remove(outputPath)
      if (listFiles("tmp/nakama").length === 0) {
        remove("tmp/nakama")
      }
      if (listFiles("tmp").length === 0) {
        remove("tmp")
      }
    }
    process.on("exit", () => killServer())
    process.on("SIGINT", () => killServer())
    process.on("SIGTERM", () => killServer())
    process.on("SIGHUP", () => killServer())

    next({
      success: true,
    })
  })
}
