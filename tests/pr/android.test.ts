import {androidSafetyChecks as android} from '../../org/pr/android'

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any
beforeEach(() => {
  global.warn = jest.fn()
  global.danger = {
    git: {}
  }
})


describe("android safety checks", () => {
  describe("when the relase notes have changes", () => {
    it("warns if there are not changes to the PlayStoreStrings file", async () => {
      global.danger.git.modified_files = [
        "metadata/release_notes.txt"
      ]

      await android()

      expect(global.warn).toHaveBeenCalledWith(
        "The PlayStoreStrings.po file must be updated any time changes are made to release notes."
      )
    })

    it("doesn't warn if there are changes to the PlayStoreStrings file", async () => {
      global.danger.git.modified_files = [
        "metadata/release_notes.txt",
        "metadata/PlayStoreStrings.po",
      ]

      await android()

      expect(global.warn).not.toHaveBeenCalled()
    })
  })
})
