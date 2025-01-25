import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import "dotenv/config"
import { logger } from 'hono/logger'
import { csrf } from 'hono/csrf'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { timeout } from 'hono/timeout'
import { HTTPException } from 'hono/http-exception'
import { prometheus } from '@hono/prometheus'
import { cors } from 'hono/cors'

import { bookRouter } from './books/books.router'
import { TIUser } from './drizzle/schema'
import db from './drizzle/db'


const app = new Hono().basePath('/api')

// Apply CORS middleware globally
app.use(cors({
  origin: '*', // Adjust this as needed for security
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

const customTimeoutException = () =>
  new HTTPException(408, {
    message: `Request timeout after waiting for more than 10 seconds`,
  })

const { printMetrics, registerMetrics } = prometheus()

// inbuilt middlewares
app.use(logger())  //logs request and response to the console
app.use(csrf()) //prevents CSRF attacks by checking request headers.
app.use(trimTrailingSlash()) //removes trailing slashes from the request URL
app.use('/', timeout(10000, customTimeoutException))
//3rd party middlewares
app.use('*', registerMetrics)



///webhhook
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createUserService, deleteUserService, updateUserService } from './users/users.services'



// Clerk webhook secret (from Clerk Dashboard)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env');
}

app.post('/webhook', async (c) => {
  // Get the headers
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Error occurred -- no svix headers' }, 400);
  }

  // Get the body
  const payload = await c.req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return c.json({ error: 'Error occurred' }, 400);
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  // Handle the event
  switch (eventType) {
    case 'user.created': {
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

      // const user = {
      //   clerkId: id,
      //   email: email_addresses[0].email_address,
      //   username: username!,
      //   firstName: first_name,
      //   lastName: last_name,
      //   photo: image_url,
      // };

      // const newUser = await createUserService(user );

      // if (newUser) {
      //   await clerkClient.users.updateUserMetadata(id, {
      //     publicMetadata: {
      //       userId: newUser.id,
      //     },
      //   });
      // }

      // return c.json({ message: 'OK', user: newUser });

      const user: TIUser = {
        clerkId: id,
        firstName: first_name || null, // Handle optional fields
        lastName: last_name || null, // Handle optional fields
        email: email_addresses[0].email_address,
        createdAt: new Date(), // Optional if the database sets it automatically
      };
    
      const newUser = await createUserService(user);
    
      if (newUser) {
        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser.id, // Use `newUser.id` instead of `newUser._id`
          },
        });
      }
    
      return c.json({ message: 'OK', user: newUser });
    }

    case 'user.updated': {
      const { id, image_url, first_name, last_name, username } = evt.data;

      const user = {
        firstName: first_name,
        lastName: last_name,
        username: username!,
        photo: image_url,
      };

      const updatedUser = await updateUserService(id, user);

      return c.json({ message: 'OK', user: updatedUser });
    }

    case 'user.deleted': {
      const { id } = evt.data;

      const deletedUser = await deleteUserService(id!);

      return c.json({ message: 'OK', user: deletedUser });
    }

    default:
      return c.json({ error: 'Unhandled event type' }, 400);
  }
});






// default route
app.get('/ok', (c) => {
  return c.text('The server is running📢😏😏😏!')
})
app.get('/timeout', async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 11000))
  return c.text("data after 5 seconds", 200)
})
app.get('/metrics', printMetrics)


app.route("/", bookRouter)   // /users/ /profile



serve({
  fetch: app.fetch,
  port: Number(process.env.PORT)
})
console.log(`Server is running on port ${process.env.PORT}`)