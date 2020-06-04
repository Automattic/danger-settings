import { checkMilestone as milestone } from "../../org/pr/milestone";

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any
beforeEach(() => {
  global.warn = jest.fn()
  global.danger = {
    github: {
      api: {
        pulls: {
          get: jest.fn()
        }
      },
      issue: {
        labels: []
      },
      pr: {
        base: {
          ref: ""
        }
      }
   }
  }
})

describe("PR milestone checks", () => {
  it("warns when there is no milestone", async () => {
    const data = { data: { draft: false, milestone: null } }
    global.danger.github.api.pulls.get.mockReturnValueOnce(Promise.resolve(data))

    await milestone();

    expect(global.warn).toHaveBeenCalledWith("PR is not assigned to a milestone.");
  })

  it("does not warn when there is a milestone", async () => {
    const data = { data: { draft: false, milestone: [{ number: 1 }] } }
    global.danger.github.api.pulls.get.mockReturnValueOnce(Promise.resolve(data))

    await milestone();

    expect(global.warn).not.toHaveBeenCalled();
  })

  it("does not warn when there is no milestone but there is PR is a draft", async () => {
    const data = { data: { draft: true, milestone: null } }
    global.danger.github.api.pulls.get.mockReturnValueOnce(Promise.resolve(data))

    await milestone();

    expect(global.warn).not.toHaveBeenCalled();
  })

  it("does not warn when there is no milestone but there is the 'Releases' label", async () => {
    const data = { data: { draft: false, milestone: null } }
    global.danger.github.api.pulls.get.mockReturnValueOnce(Promise.resolve(data))

    global.danger.github.issue.labels = [
      {
        name: 'Releases'
      }
    ]

    await milestone();

    expect(global.warn).not.toHaveBeenCalled();
  })

  it("does not warn when there is no milestone but there is the WIP feature label", async () => {
    const data = { data: { draft: false, milestone: null } }
    global.danger.github.api.pulls.get.mockReturnValueOnce(Promise.resolve(data))

    global.danger.github.issue.labels = [
      {
        name: 'Part of a WIP Feature'
      }
    ]

    await milestone();

    expect(global.warn).not.toHaveBeenCalled()
  })

  it("warns when there is no milestone and WIP feature label but the base branch is develop", async () => {
    const data = { data: { draft: false, milestone: null } }
    global.danger.github.api.pulls.get.mockReturnValueOnce(Promise.resolve(data))

    global.danger.github.issue.labels = [
      {
        name: 'Part of a WIP Feature'
      }
    ]
    global.danger.github.pr.base.ref = 'develop'

    await milestone();

    expect(global.warn).toHaveBeenCalledWith("PR is not assigned to a milestone.");
  })

  it("warns when there is no milestone and WIP feature label but the base branch is release", async () => {
    const data = { data: { draft: false, milestone: null } }
    global.danger.github.api.pulls.get.mockReturnValueOnce(Promise.resolve(data))

    global.danger.github.issue.labels = [
      {
        name: 'Part of a WIP Feature'
      }
    ]
    global.danger.github.pr.base.ref = 'release/1.2'

    await milestone();

    expect(global.warn).toHaveBeenCalledWith("PR is not assigned to a milestone.");
  })
})
