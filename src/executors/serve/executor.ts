import { ServeExecutorSchema } from "./schema"
import { spawn } from "child_process"
import { ExecutorContext, getWorkspaceLayout, workspaceRoot } from "@nx/devkit"
import { createAsyncIterable } from "@nx/devkit/src/utils/async-iterable"
import * as path from "path"
import { createBuild, copyConfigFile } from "../../utils/build"
import { remove } from "fs-extra"
import { listFiles } from "@nx/plugin/testing"
import { executeCommand } from "../../utils/exec"
import { getDatabaseAddresses } from "../../utils/nakama"
import { FsTree } from "nx/src/generators/tree"
import { posixJoin } from "../../utils/posix"

export default async function* runExecutor(options: ServeExecutorSchema, context: ExecutorContext) {
  const { configFileName, migrateDatabase } = options
  const projectRoot = context.projectGraph.nodes[context.projectName].data.root
  const appsDir = getWorkspaceLayout(new FsTree(workspaceRoot, false)).appsDir
  const outputPath = posixJoin("tmp", appsDir, context.projectName)

  // Create build and copy config file
  await createBuild(projectRoot, outputPath)
  copyConfigFile(projectRoot, outputPath, configFileName)

  const configFile = posixJoin(projectRoot, configFileName)
  const databaseAddresses = await getDatabaseAddresses(configFile)
  if (databaseAddresses.length === 0) {
    console.warn(`No database configured in ${configFile}`)
  }

  if (migrateDatabase && databaseAddresses.length > 0) {
    console.log("Migrating databases...")
    for (const databaseAddress of databaseAddresses) {
      await executeCommand(
        `nakama migrate up --database.address ${databaseAddress}`,
        posixJoin(workspaceRoot, outputPath)
      )
    }
  }

  yield* createAsyncIterable<{ success: boolean }>(async ({ done, next, error }) => {
    const serverProcess = spawn("nakama", ["--config " + configFileName], {
      cwd: posixJoin(workspaceRoot, outputPath),
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
      for (let dir = outputPath; dir !== "tmp"; dir = path.dirname(dir)) {
        if (listFiles(dir).length === 0) {
          remove(dir)
        }
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
