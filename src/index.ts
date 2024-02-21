import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { basicAuth } from "hono/basic-auth"
import { serveStatic } from "@hono/node-server/serve-static"
import { validator } from "hono/validator"
import { z } from "zod"
import { zValidator } from '@hono/zod-validator'
import { bearerAuth } from 'hono/bearer-auth'

const app = new Hono({
  strict: true
})

// Return Text
app.get('/', (c) => c.text('Hello Hono!'))

// Return JSON
app.get("/api/hello", (c) => {
  return c.json({
    ok: true,
    message: "Hello World!"
  })
})

// Query and Params
app.get("/posts/:id", (c) => {
  const page = c.req.query("page")
  const id = c.req.param("id")
  c.header("X-Message", "Hi!")
  return c.text(`You want to see page:${page} of id:${id}`)
})

// Post
app.post("/posts", (c) => {
  return c.text("Created!", 201)
})

// Delete
app.delete("/posts/:id", (c) => {
  const id = c.req.param("id")
  return c.text(`You want to delete item of id:${id}`)
})

// Return raw response
app.get("/raw", (c) => {
  return new Response("Good morning")
})

// Using Middleware 
app.use("/admin/*", basicAuth({
  username: "admin",
  password: "admin"
}))

app.get("/admin", (c) => {
  return c.text("You are authorized")
})

// Serve static files
app.use("/static", serveStatic({
  root: "./"
}))

// Not Found
app.notFound((c) => {
  return c.text("Custom 404 Message, change as you like", 404)
})

// Error Handling
app.onError((err, c) => {
  console.error(err)
  return c.text('Custom Error Message', 500)
})

// Path Prameter
app.get("/user/:name", (c) => {
  const name = c.req.param("name")
  return c.text(name)
})

app.get("/posts/:id/comment/:comment_id", (c) => {
  const { id, comment_id } = c.req.param()
  return c.json({
    id: id,
    comment_id: comment_id
  })
})

// Optional Parameter
app.get("/api/animal/:type?", (c) => {
  const type = c.req.param("type")
  return c.text(`Animal ${type}`)
})

// Regexp
app.get("/post/:date{[0-9]+}/:title{[a-z]+}", (c) => {
  const { date, title } = c.req.param()
  return c.json({
    date: date,
    title: title
  })
})

// Including slashes
app.get("/posts/:filename{.+\\.png$}", (c) => {
  //...
  return c.text("Including slashes")
})

// Chain route
app
  .get("/endpoint", (c) => c.text("GET /endpoint"))
  .post((c) => c.text("POST /endpoint"))
  .delete((c) => c.text("DELETE /endpoint"))

// Grouping
const book = new Hono()
book.get("/", (c) => {
  return c.text("List Books")
})
book.get("/:id", (c) => {
  // GET /book/:id
  const id = c.req.param("id")
  return c.text("Get Book: " + id)
})
book.post("/", (c) => {
  return c.text("Create Book")
})
app.route("/book", book)

// Base path
const api = new Hono().basePath("/v1")
api.get("/book", (c) => {
  return c.text("List Books")
})
app.route("/api", api)

// Context - req
app.get("/context", (c) => {
  const userAgent = c.req.header('User-Agent')
  if (userAgent !== undefined) {
    return c.text(userAgent)
  }
  return c.text("no context")
})

// Shortcuts for the Response
app.get("/welcome", (c) => {
  // Set Headers
  c.header("X-Message", "Hello")
  c.header("Content-Type", "text/plain")

  // Set HTTP status code
  c.status(201)

  // Return the response body
  return c.body("Thank you for coming")
})

// Context - text()
app.get("/say", (c) => {
  return c.text("Hello!")
})
// specify the status code and add headers
app.post("/newpost", (c) => {
  return c.text("Created!", 201, {
    "X-Custom": "Thank you!",
  })
})

// Context - redirect()
app.get("/redirect", (c) => c.redirect("/"))
app.get("/redirect-permanently", (c) => c.redirect("/", 301))

// Context - res
app.use("/", async (c, next) => {
  await next()
  c.res.headers.append("X-Debug", "Debug message")
})

// Context - query()
app.get("/search", (c) => {
  const query = c.req.query('q') as string
  return c.text(query)
})
// get all params at once
// app.get("/search", (c) => {
//   const { q, limit, offset } = c.req.query()
//   ...
// })

// Context - path url method
app.get("/about/me", (c) => {
  const pathname = c.req.path
  const url = c.req.url
  const method = c.req.method
  return c.json({
    path: pathname,
    url: url,
    method: method
  })
})

// Validation
app.post("/validate", validator("form", (value, c) => {
  const body = value["body"]
  if (!body || typeof body !== 'string') {
    return c.text("Invalid!", 400)
  }
  return {
    body: body,
  }
}))

// Validation - zod
const schema = z.object({
  body: z.string(),
})
app.post("/zod", validator("form", (value, c) => {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    return c.text("Invalid!", 401)
  }
  return parsed.data
}), (c) => {
  const { body } = c.req.valid("form")
  // ... do something
  return c.json({
    message: "Created!"
  }, 201)
})

// Validation - zValidator
app.post("/zvalidator", zValidator(
  "form",
  z.object({
    body: z.string(),
  })
), (c) => {
  // ... do something
  return c.text("zValidator")
})

// Bearer Auth Middleware
const token = "honoiscool"
app.get("/api/page", (c) => {
  return c.json({
    message: "Read posts"
  })
})
app.post("/api/page", bearerAuth({ token }), (c) => {
  return c.json({
    message: "Created post!"
  }, 201)
})


// print all routes to console
app.showRoutes()

// Default node.js port 3000
// serve(app)
// Change port to your choice
serve({
  fetch: app.fetch,
  port: 3000
})
