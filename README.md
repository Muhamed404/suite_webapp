# Frontend Server Application

The Frontend application server acts as a middleware between a user and the backend system. It provides a user interface and render the pages according to the user role.

It communicates with the Backend Server and Schedular Service using their exposed APIs.

This project is built with the NodeJS Express framework.

## Pre-requisites 

0. Setup backend system by following [backend Installation](../backend/README.md)

1. Install NPM on your operating system regardless linux or windows.

2. Install the **Redis**. If you are using windows then follow the following guideline [WSL and Redis Installation](../Wsl_Redis_Installation.md) . If you are using Linux follow __sudo apt install redis-server -y__ 

3. Clone the repo **frontend** 

4. Install Visual Code , with the following plugins ENV, HTML Boilerplate , HTML CSS, or any other which will help you in nodejs or express framework.

5. Install dependencies via terminal, run below command in the frontend folder e.g. frontend/ 

```bash
  npm install
```

## Configuration Setup 

Now you are good to run the frontend server but you have configure several variables. 

0. Go to the config folder of the frontend e.g. 

1. Create .env file inside frontend root folder

```bash
    frontend/.env
``` 
2. Following configuration is required.
- `BACKEND_EP`: The backend system's IP address and port, using HTTP or HTTPS (e.g., http://127.0.0.1:3000)
- `HOST`: The IP address or hostname where the frontend application server will run
- `PORT`: The port number for the frontend application server
- `NODE_ENV`: The environment name (e.g., Development, Production)
- `SECURE_MAGNUS_WORKSPACE`: The workspace directory path for the application
- `LOGS_DIR`: Directory path where log files will be stored
- `LOGS_FILENAME`: Name of the log file
- `REDIS_SERVER_IP`: Redis server IP address or hostname
- `REDIS_SERVER_PORT`: Redis server port number
- `REDIS_SESSION_SECRET_KEY`: Secret key for Redis session (must be the same in both Backend & Frontend)
- `Cookie_JWT_TOKEN_EXPIRY`: Cookie expiry & JWT Expiry in minutes
- `BACKEND_TVBS_URL`: TVBS system backend URL


```bash
        NODE_ENV=Development
        HOST=127.0.0.1
        PORT=8000
        BACKEND_EP=http://127.0.0.1:3000


        REDIS_SERVER_IP=127.0.0.1
        REDIS_SERVER_PORT=6379
        REDIS_SESSION_SECRET_KEY=password123
        Cookie_JWT_TOKEN_EXPIRY=20

        SECURE_MAGNUS_WORKSPACE=c:\secure_magnus_workspace
        

        # Backend TVBS Configuration
        BACKEND_TVBS_URL=http://127.0.0.1:9000/

        # Logger
        LOGS_DIR=C:\SecureMagnus\application logs
        LOGS_FILENAME="frontend"

```

## Run the project in Dev Mode 
  1. Open Terminal and run the following command.
  
  ```bash
    npm run development 
  ```

2. Upon successful run, the following information will appear in your terminal:

    > ✅ Server Started  
    🚀 Server listening at http://127.0.0.1:8000  
    🚀 Healthcheck: http://127.0.0.1:8000/health