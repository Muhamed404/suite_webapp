# Install WSL Ubuntu with Redis Server

This guide helps you install **WSL (Windows Subsystem for Linux)**, set up **Ubuntu**, and install **Redis Server** on a Windows machine.

---

## 🧰 Prerequisites

- Windows 10 (version 2004 and higher) or Windows 11
- Admin privileges

---

## 🚀 Step 1: Enable WSL

1. Open PowerShell **as Administrator**.
2. Run the following command:

```powershell
wsl --install
```
3. Then restart your machine (Very important step)
4. Now after the restart open powershell and  install Ubuntu using:
```powershell
wsl --install -d Ubuntu
```
## 🐧 Step 2: Set Up Ubuntu

After installing WSL with Ubuntu:

1. **Launch Ubuntu**  
   You can open it from the Start Menu by searching for "Ubuntu".

2. **Initial Setup**  
   When you launch Ubuntu for the first time, it will ask you to create a **new UNIX username and password**.  
   This user will be your default WSL user.

3. **Update Your Package List**  
   It's always a good idea to make sure everything is up to date. Run:

   ```bash
   sudo apt update && sudo apt upgrade -y
   
## 🧠 Step 3: Install Redis Server

Once Ubuntu is set up, follow these steps to install Redis:

1. **Install Redis Server**

   Run the following command in your Ubuntu terminal:

   ```bash
   sudo apt install redis-server -y

2. **Verify Redis Installation**

   Run the following command in your Ubuntu terminal:

   ```bash
   redis-server --version
3. **Start Redis Service**

   Start the Redis server with:

   ```bash
   sudo service redis-server start
4. **Enable Redis on Boot (Optional)**

   If you want Redis to start automatically when your WSL Ubuntu instance starts:

   ```bash
   sudo systemctl enable redis-server
Note: WSL does not run services at boot by default. You may need to start Redis manually or use a script unless WSL auto-service setup is configured.

5. **Test Redis Server**
  
   Execute the below command on the Ubuntu console:
   ```bash
   cmd: redis-cli ping
   output: PONG
   ```



7. **Troubleshooting (Optional)**

   If you face issues like:
   The operation could not be started because a required feature is not installed.

   Error code: Wsl/InstallDistro/Service/RegisterDistro/CreateVm/HCS/HCS_E_SERVICE_NOT_AVAILABLE

   Then check following

   1. Go to yout BIOS and check if Hyper-V or Virtualization is enabled (if it is not then you cannot run untill it is supported). Enable this and then restart your computer then again try installing ubuntu on the wsl.
      
   3. If it is already enabled then check after restarting your computer.
      
   5. If you are using Home Windows Edition, then still it does supports the WSL 2 version. Try to make the default wsl version as 2.0.
  
      
   ```bash
      wsl --set-default-version 2
   ```

    Then restart and again try this command on the powershell

   ```bash
      wsl --install -d Ubuntu
   ```
 
