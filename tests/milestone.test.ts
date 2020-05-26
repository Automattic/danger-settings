import { checkMilestone as milestone } from "../org/milestone";

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any
beforeEach(() => {
  global.warn = jest.fn()
  global.danger = {
    github: {
      api: {
        issues: {
          get: jest.fn(),
        }
      },
      issue: {
        labels: []
      }
   }
  }
})

describe("PR milestone checks", () => {
  it("warns when there is no milestone", async () => {
    global.danger.github.api.issues.get.mockReturnValueOnce(Promise.resolve({ data: { milestone: null } }))

    await milestone();

    expect(global.warn).toHaveBeenCalledWith("PR is not assigned to a milestone.");
  })

  it("does not warn when there is a milestone", async () => {
    global.danger.github.api.issues.get.mockReturnValueOnce(Promise.resolve({ data: { milestone: [{ number: 1 }] } }))

    await milestone();

    expect(global.warn).not.toHaveBeenCalled();
  })
})
