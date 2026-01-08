# NebulaFX Deploy

This directory contains the deployment scripts and configurations for the project.
The deployment process is divided into two main parts: the NebulaFX binary and the NebulaFX console. The NebulaFX binary is
responsible for the core functionality of the system, while the NebulaFX console provides a web-based interface for
managing and monitoring the system.

# Directory Structure

```text
|--data // data directory
|  |--vol1 // volume 1 not created 
|  |--vol2 // volume 2 not created
|  |--vol3 // volume 3 not created
|  |--vol4 // volume 4 not created
|  |--README.md // data directory readme
|--logs // log directory
|  |--nebulafx.log // NebulaFX log
|  |--README.md // logs directory readme
|--build
|  |--nebulafx.run.md // deployment script for NebulaFX
|  |--nebulafx.run-zh.md // deployment script for NebulaFX in Chinese
|  |--nebulafx.service // systemd service file
|  |--nebulafx-zh.service.md // systemd service file in Chinese
|--certs
|  ├── nebulafx_cert.pem        // Default｜fallback certificate
|  ├── nebulafx_key.pem         // Default｜fallback private key
|  ├── nebulafx.com/    // certificate directory of specific domain names
|  │   ├── nebulafx_cert.pem
|  │   └── nebulafx_key.pem
|  ├── api.nebulafx.com/
|  │   ├── nebulafx_cert.pem
|  │   └── nebulafx_key.pem
|  └── cdn.nebulafx.com/
|      ├── nebulafx_cert.pem
|      └── nebulafx_key.pem
|--config
|  |--nebulafx.env // env config
|  |--nebulafx-zh.env // env config in Chinese
```