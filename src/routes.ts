import { route } from '@react-router/dev/routes'

export default [
  route('en?', 'pages/Home.tsx'),
  route('en?/products', 'routes/products-index.tsx'),
  route('en?/products/:slug', 'pages/ProductDetail.tsx'),
  route('en?/papers', 'pages/Papers.tsx'),
  route('en?/papers/:cancer/:id', 'pages/PaperDetail.tsx'),
  route('en?/guidelines', 'pages/Guidelines.tsx'),
  route('en?/guidelines/:cancer/:id', 'pages/GuidelineDetail.tsx'),
  route('en?/blog', 'pages/Blog.tsx'),
  route('en?/blog/:slug', 'pages/BlogPost.tsx'),
  route('en?/about', 'pages/About.tsx'),
  route('en?/contact', 'pages/Contact.tsx'),
  route('*', 'pages/NotFound.tsx'),
]
