export async function wordPressIOS () {
  // The imports _need_ to be done within this async function
  // picked up by the imports resolver Danger uses with remote
  const {checkLabel} = await import("../org/label")
  const {checkMilestone} = await import("../org/milestone")
  const {iOSSafetyChecks} = await import("../org/pr/ios")

  await checkLabel()
  await checkMilestone()
  await iOSSafetyChecks()
}

export default wordPressIOS
