# gatsby-source-squeak

A Gatsby source plugin for sourcing data into your Gatsby application from Squeak!

## How to use

```
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-squeak`,
      options: {
        url: `YOUR_SUPABASE_URL`,
        apiKey: `YOUR_SUPABASE_ANON_KEY`,
      },
    },
  ],
}
```
