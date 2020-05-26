import {iOSSafetyChecks as ios} from "../../org/pr/ios"

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any
beforeEach(() => {
  global.message = jest.fn()
  global.warn = jest.fn()
  global.danger = {
    git: {
      created_files: [],
      deleted_files: [],
      modified_files: []
    },
    github: {
      issue: {
        labels: []
      },
      pr: {
        base: { ref: 'test' },
        head: { ref: 'test' },
      },
      utils: {}
    }
  }
})


beforeEach(() => {
  global.message = jest.fn().mockReturnValue(true)
  global.warn = jest.fn().mockReturnValue(true)

  global.danger = {
    git: {
      created_files: [],
      deleted_files: [],
      modified_files: []
    },
    github: {
      issue: {
        labels: []
      },
      pr: {
        base: { ref: 'test' },
        head: { ref: 'test' },
      },
      utils: {}
    },
  }

  global.danger.github.utils.fileContents = () => Promise.resolve('')
})

describe("iOS safety checks", () => {
  it("notifies the user that some checks will be skipped on PRs with 'Releases' label", async () => {
    global.danger.github.issue.labels = [
      {
        name: 'Releases'
      }
    ]

    await ios()

    expect(global.message).toHaveBeenCalledWith(
      "This PR has the 'Releases' label: some checks will be skipped."
    )
  })

  it("does not notify the user that some checks will be skipped on PRs without 'Releases' label", async () => {
    global.danger.github.issue.labels = [
      {
        name: 'not releases'
      }
    ]

    await ios()

    expect(global.message).not.toHaveBeenCalled()
  })

  it("warns when updating strings on not release branch", async () => {
    global.danger.git.modified_files = ["WordPress/Resources/en.lproj/Localizable.strings"]

    await ios();

    expect(global.warn).toHaveBeenCalledWith("Localizable.strings should only be updated on release branches because it is generated automatically.");
  })

  it("does not warn when pdating strings on release branch", async () => {
    global.danger.git.modified_files = ["WordPress/Resources/en.lproj/Localizable.strings"]
    global.danger.github.pr.head.ref="release/1.1";

    await ios();

    expect(global.warn).not.toHaveBeenCalled();
  })

  it("does not warns when updating strings on not release branch and releases label", async () => {
    global.danger.git.modified_files = ["WordPress/Resources/en.lproj/Localizable.strings"]
    global.danger.github.issue.labels = [
      {
        name: 'Releases'
      }
    ]

    await ios();

    expect(global.warn).not.toHaveBeenCalled();
    expect(global.message).toHaveBeenCalledWith("This PR has the 'Releases' label: some checks will be skipped.");
  })
})
