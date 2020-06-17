export async function wordPressAndroid () {
  // The imports _need_ to be done within this async function
  // picked up by the imports resolver Danger uses with remote
  const {checkLabel} = await import("../org/label")
  const {checkMilestone} = await import("../org/pr/milestone")
  const {checkDiffSize} = await import("../org/pr/diff-size")
  const {checkSubtrees} = await import("../org/pr/check-subtrees")
  const {androidSafetyChecks} = await import("../org/pr/android")

  await checkLabel()
  await checkDiffSize()
  // This is disabled because it needs more refined event handling on the
  // GitHub Actions workflow side.
  // See https://github.com/wordpress-mobile/WordPress-iOS/pull/14187
  // await checkMilestone()
  await androidSafetyChecks()
  await checkSubtrees()
}

export default wordPressAndroid
