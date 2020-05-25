jest.mock("danger", () => jest.fn())
import * as danger from "danger"
const dm = danger as any

import {iOSSafetyChecks as ios} from "../../org/pr/ios"

beforeEach(() => {
  dm.message = jest.fn().mockReturnValue(true)
  dm.warn = jest.fn().mockReturnValue(true)

  dm.danger = {
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

  dm.danger.github.utils.fileContents = async (_path, _repo, ref) => { return "" }

})

describe("iOS safety checks", () => {
  it("notifies the user that some checks will be skipped on PRs with 'Releases' label", async () => {
    dm.danger.github.issue.labels = [
      {
        name: 'Releases'
      }
    ]

    await ios()

    expect(dm.message).toHaveBeenCalledWith(
      "This PR has the 'Releases' label: some checks will be skipped."
    )
  })

  it("does not notify the user that some checks will be skipped on PRs without 'Releases' label", async () => {
    dm.danger.github.issue.labels = [
      {
        name: 'not releases'
      }
    ]

    await ios()

    expect(dm.message).not.toHaveBeenCalled()
  })

  it("warns when updating strings on not release branch", async () => {
    dm.danger.git.modified_files = ["WordPress/Resources/en.lproj/Localizable.strings"]

    await ios();

    expect(dm.warn).toHaveBeenCalledWith("Localizable.strings should only be updated on release branches because it is generated automatically.");
  })

  it("does not warn when pdating strings on release branch", async () => {
    dm.danger.git.modified_files = ["WordPress/Resources/en.lproj/Localizable.strings"]
    dm.danger.github.pr.head.ref="release/1.1";

    await ios();

    expect(dm.warn).not.toHaveBeenCalled();
  })

  it("does not warns when updating strings on not release branch and releases label", async () => {
    dm.danger.git.modified_files = ["WordPress/Resources/en.lproj/Localizable.strings"]
    dm.danger.github.issue.labels = [
      {
        name: 'Releases'
      }
    ]

    await ios();

    expect(dm.warn).not.toHaveBeenCalled();
    expect(dm.message).toHaveBeenCalledWith("This PR has the 'Releases' label: some checks will be skipped.");
  })
})
