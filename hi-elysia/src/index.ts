import { Elysia, t } from 'elysia'

const app = new Elysia()

// get request
app.get("/", () => "Hello Elysia")

// grap params
app.get("/id/:id", (context) => context.params.id)

// post request
app.post("/new", ({ body }) => {
    console.log(body)

    // const signed = signIn(body)
    // if (signed)
    //     return "Welcome back"

    // set.status = 403
    // return "Invalid username or password"
    var jsonFile = JSON.stringify({
        'vtuber': [
            'Shirakami Fubuki',
            'Inugami Korone'
        ]
    })
    return new Response(jsonFile, { headers: { 'Content-Type': 'application/json' } })
})

// Automatic JSON Response
app.get("/auto", () => ({
    'vtuber': [
        'Shirakami Fubuki',
        'Inugami Korone'
    ]
}))

// State and Decorate
app
    .state("version", 1)
    .decorate("getDate", () => Date.now())
    .get("/version", ({
        getDate,
        store: { version }
    }) => `${version} ${getDate()}`
    )


// Group
app.group("/user", app => app
    .post("/sign-in", () => "signIn()")
    .post("/sign-up", () => "signUp()")
    .get("/profile", () => "getProfile()")
)

// Nested Group
app.group("/v1", app => app
    .get("/", () => "Using v1")
    .group("/user", app => app
        .post("/sign-in", () => "signIn()")
        .post("/sign-up", () => "signUp()")
        .get("/profile", () => "getProfile()")
    )
)

// Local Schema Validation
app.post("/mirror", ({ body }) => body, {
    body: t.Object({
        username: t.String(),
        password: t.String()
    })
})

// Global and Scope Validation
app.guard({ response: t.String() }, app => app
    .get("/global", () => "Hi")
    // invalid: will throw error
    // .get("/invalid", () => 1)
)

app.guard({
    response: t.String()
}, app => app.guard({
    response: t.Number()
}, app => app
    // Invalid will throw an error
    // .get("/nearest", () => "Hi")
    .get("/now-valid", () => 1)
)
)

// Multiple Status Response
app.post("/multi", ({ body }) => body, {
    body: t.Object({
        username: t.String(),
        password: t.String()
    }),
    response: {
        200: t.Object({
            username: t.String(),
            password: t.String()
        }),
        400: t.String()
    }
})

app.listen(5000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
