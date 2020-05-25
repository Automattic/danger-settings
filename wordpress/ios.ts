export default async () => {
  // The imports _need_ to be done within this async function in order to be
  // picked up by the imports resolver Danger uses with remote Dangerfiles.
  const {checkLabel} = await import("./label")
  const {checkMilestone} = await import("./milestone")

  await checkLabel()
  await checkMilestone()
}
