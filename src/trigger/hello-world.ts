import { task } from "@trigger.dev/sdk/v3"

export const helloWorld = task({
  id: "hello-world",

  run: async () => {
    console.log("Hello from Trigger.dev!")

    return {
      message: "Hello World",
    }
  },
})
