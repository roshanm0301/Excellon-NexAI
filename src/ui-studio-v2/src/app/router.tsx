import { createRouter } from "@tanstack/react-router"
import { Route as rootRoute } from "@/routes/__root"
import { Route as indexRoute } from "@/routes/index"
import { Route as homeRoute } from "@/routes/home"
import { Route as signinRoute } from "@/routes/signin"
import { Route as settingsRoute } from "@/routes/settings"
import { Route as editorAppRoute } from "@/routes/editor.$appId"
import { Route as editorPageRoute } from "@/routes/editor.$appId.$pageId"

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  signinRoute,
  settingsRoute,
  editorAppRoute.addChildren([editorPageRoute]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
