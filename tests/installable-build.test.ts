import {installableBuild} from "../org/installable-build";

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any

beforeEach(() => {
  global.console = {
    log: jest.fn()
  }

  global.danger = {
    github: {
      api: {
        repos: {
          createStatus: jest.fn()
        },
        search: {
          issuesAndPullRequests: jest.fn(),
        },
        issues: {
          createComment: jest.fn(),
          listComments: jest.fn()
        },
        pulls: {
          get: jest.fn(),
        }
      },
      issue: {
        labels: []
      }
    }
  }

  global.warn = jest.fn()

  // Mock Github API for posting comments
  // Gets a corresponding issue
  global.danger.github.api.search.issuesAndPullRequests.mockReturnValueOnce(Promise.resolve({ data: { items: [{ number: 1 }] } }))
  // No existing comments
  global.danger.github.api.issues.listComments.mockReturnValueOnce(Promise.resolve({data: []}))
  // Returns a PR with the right commit
  global.danger.github.api.pulls.get.mockReturnValueOnce(
    Promise.resolve({ data: { head: { sha: "abc" } } })
  )
  // Mock commenting on the PR
  global.danger.github.api.issues.createComment.mockReturnValueOnce(Promise.resolve({data: { html_url: "https://github.com/comment_url" }}))
})

const expectComment = (webhook: any, commentBody: string) => {
  expect(global.danger.github.api.issues.createComment).toBeCalledWith({
    owner: webhook.repository.owner.login,
    repo: webhook.repository.name,
    number: 1,
    body: `<!--- Installable Build Comment --->\n${commentBody}`
  })
  expect(console.log).toBeCalledWith('Installable build comment posted to https://github.com/comment_url')
}


describe("installable build handling", () => {
  it("bails when it's not a status/state we want to handle", async () => {
    // The original source casts as any, I'm guessing to work around the need to add extra information to the typed value.
    // Argument of type     '{ state: string; context: string; }' is not assignable to parameter of type              'Status'. Type '{ state: string; context: string; }' is missing the following             properties from type 'Status': id, sha, name, commit, and 5 more.
    // Later on, I'd like to do something about this, for example by creating a
    // builder function in this test for it.
    await installableBuild({ state: "fail", context: "Failure context" } as any);
    expect(console.log).toBeCalledWith(
      "Not a status we want to process for installable builds - got 'Failure context' (fail)"
    )

    await installableBuild({ state: "success", context: "ci/circleci: Installable Build/Hold" } as any)
    expect(console.log).toBeCalledWith(
      "Not a status we want to process for installable builds - got 'ci/circleci: Installable Build/Hold' (success)"
    )
  })

  it("updates the state to be 'success' when it is the right context and comments", async () => {
    const webhook: any = {
      state: "pending",
      context: "ci/circleci: Installable Build/Hold",
      description: "Holding build",
      target_url: "https://circleci.com/workflow-run/abcdefg",
      repository: {
        name: 'Repo',
        owner: { login: 'Owner' }
      },
      commit: { sha: 'abc' }
    }
    await installableBuild(webhook)

    expect(global.danger.github.api.repos.createStatus).toBeCalledWith({
      owner: webhook.repository.owner.login,
      repo: webhook.repository.name,
      state: "success",
      context: webhook.context,
      description: webhook.description,
      target_url: webhook.target_url,
    })

    expectComment(webhook, `You can trigger an installable build for these changes by visiting CircleCI [here](${webhook.target_url}).`)
  })
})
