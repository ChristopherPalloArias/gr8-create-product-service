# Create Product Service

This is the microservice for create Product in the +Kotas App.

## Group Members

- Christopher Pallo
- Brayan Dávila

## Table of Contents

1. [Microservice Description](#microservice-description)
2. [Installation](#installation)
   - [Requirements](#requirements)
   - [Clone the Repository](#clone-the-repository)
   - [Install Dependencies](#install-dependencies)
   - [Start the Server](#start-the-server)
   - [Evidence](#evidence)
3. [Usage](#usage)
   - [Verify Server Functionality](#verify-server-functionality)

## Microservice Description

The `create-product-service` microservice is responsible for managing the list of users in the +kotas App. Allows you to list products using an HTTP PUT request to the corresponding route.

## Installation

### Requirements

- Node.js
- npm (Node Package Manager)

### Clone the Repository

```sh
https://github.com/ChristopherPalloArias/gr8-create-product-service.git
cd list-user-service
```

### Install Dependencies
```sh
npm install
```

### Starting the Server
Before starting the application you must change the database credentials in the index.js file if you want to use the application locally and independently, this is because initially the application is configured to be used in conjunction with the rest of Microservices.
Repository: [https://github.com/ChristopherPalloArias/kotas-frontend](https://github.com/ChristopherPalloArias/kotas-frontend.git)

### Evidence
![image](https://github.com/user-attachments/assets/e7154a99-d9ba-47b2-a667-7563e6cd4587)

## Usage
### Verify Server Functionality

Method: POST 
URL: `http://gr8-load-balancer-users-1651289822.us-east-2.elb.amazonaws.com:8090`  
Description: This route displays a message to verify that the server is running.
![image](https://github.com/user-attachments/assets/7c18170b-294c-4d56-aafe-a8eb514f821b)
