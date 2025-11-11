# build env
FROM node:20.13.1 as build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . ./

ARG VITE_BACKEND_URL
ARG NODE_ENV=production

RUN npm run build

# production env
FROM nginx
WORKDIR /app
COPY --from=build /app/dist ./
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
