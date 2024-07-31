import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import AWS from 'aws-sdk';

// AWS region and Lambda function configuration
const region = "us-east-2";
const lambdaFunctionName = "fetchSecretsFunction_gr8";

// Function to invoke Lambda and fetch secrets
async function getSecretFromLambda() {
  const lambda = new AWS.Lambda({ region: region });
  const params = {
    FunctionName: lambdaFunctionName,
  };

  try {
    const response = await lambda.invoke(params).promise();
    const payload = JSON.parse(response.Payload);
    if (payload.errorMessage) {
      throw new Error(payload.errorMessage);
    }
    const body = JSON.parse(payload.body);
    return JSON.parse(body.secret);
  } catch (error) {
    console.error('Error invoking Lambda function:', error);
    throw error;
  }
}

// Function to start the service
async function startService() {
  let secrets;
  try {
    secrets = await getSecretFromLambda();
  } catch (error) {
    console.error(`Error starting service: ${error}`);
    return;
  }

  const app = express();
  const port = 8090;

  app.use(cors());
  app.use(express.json());

  // Configure AWS DynamoDB
  AWS.config.update({
    region: region,
    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
  });

  const dynamoDB = new AWS.DynamoDB.DocumentClient();

  // Swagger setup
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'Product Service API',
        version: '1.0.0',
        description: 'API for managing products',
      },
    },
    apis: ['./src/index.js'],
  };

  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  // Connect to RabbitMQ
  let channel;
  async function connectRabbitMQ() {
    try {
      const connection = await amqp.connect('amqp://3.136.72.14:5672/');
      channel = await connection.createChannel();
      await channel.assertQueue('product-events', { durable: true });
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  }

  // Publish event to RabbitMQ
  const publishEvent = async (eventType, data) => {
    const event = { eventType, data };
    try {
      if (channel) {
        channel.sendToQueue('product-events', Buffer.from(JSON.stringify(event)), { persistent: true });
        console.log('Event published to RabbitMQ:', event);
      } else {
        console.error('Channel is not initialized');
      }
    } catch (error) {
      console.error('Error publishing event to RabbitMQ:', error);
    }
  };

  await connectRabbitMQ();

  /**
   * @swagger
   * /products:
   *   post:
   *     summary: Create a new product
   *     description: Create a new product with a category and quantity
   *     requestBody:
   *       description: Product object that needs to be created
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Smartphone"
   *               category:
   *                 type: string
   *                 example: "Electronics"
   *               quantity:
   *                 type: integer
   *                 example: 100
   *     responses:
   *       201:
   *         description: Product created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 productId:
   *                   type: string
   *                   example: "prod-1628073549123"
   *                 name:
   *                   type: string
   *                   example: "Smartphone"
   *                 category:
   *                   type: string
   *                   example: "Electronics"
   *                 quantity:
   *                   type: integer
   *                   example: 100
   *       500:
   *         description: Error creating product
   */
  app.post('/products', async (req, res) => {
    const { name, category, quantity } = req.body;
    console.log('Received request to create product:', req.body);

    try {
      // Verify category exists in DynamoDB
      const getCategoryParams = {
        TableName: 'Categories_gr8',
        Key: { name: category },
      };

      const categoryData = await dynamoDB.get(getCategoryParams).promise();

      if (!categoryData.Item) {
        return res.status(400).send({ message: 'Category does not exist' });
      }

      // Save product to DynamoDB
      const productId = `prod-${Date.now()}`;
      const params = {
        TableName: 'Products_gr8',
        Item: {
          productId,
          name,
          category,
          quantity,
        },
      };

      await dynamoDB.put(params).promise();

      // Publish product created event to RabbitMQ
      await publishEvent('ProductCreated', { productId, name, category, quantity });

      res.status(201).send({ productId, name, category, quantity });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).send({ message: 'Error creating product', error: error });
    }
  });

  app.get('/', (req, res) => {
    res.send('Product Service Running');
  });

  app.listen(port, () => {
    console.log(`Product service listening at http://localhost:${port}`);
  });
}

startService();
