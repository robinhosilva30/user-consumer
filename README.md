# Projeto: consumer de um gerenciador de usuários

## 🚀 Visão geral

Este projeto é um serviço Node.js que atua como **consumidor de mensagens** de uma fila RabbitMQ. Ele foi projetado para **enriquecer os dados** recebidos da fila e, em seguida, **persisti-los em um banco de dados MongoDB**. A arquitetura é conteinerizada usando **Docker** e **Docker Compose**, facilitando o setup e a execução.

A solução foca em:

* **Consumo robusto de mensagens:** Com tratamento de erros para garantir a confiabilidade da fila.
* **Enriquecimento de dados:** Lógica flexível para adicionar ou transformar informações.
* **Persistência confiável:** Utilizando MongoDB para armazenamento não relacional de dados enriquecidos.

## ✨ Tecnologias utilizadas

* **Node.js:** Ambiente de execução JavaScript.
* **RabbitMQ:** Broker de mensagens para o sistema de filas.
* **MongoDB:** Banco de dados NoSQL baseado em documentos.
* **`amqplib`:** Biblioteca Node.js para interagir com RabbitMQ.
* **`mongoose`:** ODM (Object Data Modeling) para MongoDB em Node.js.
* **`winston`:** Biblioteca de logging para Node.js.
* **Docker & Docker Compose:** Para conteinerização e orquestração dos serviços.

## ⚙️ Configuração e execução

### Pré-requisitos

Certifique-se de ter instalado em sua máquina:

* **Node.js e npm** (ou yarn)
* **Docker Desktop** (que inclui Docker Engine e Docker Compose)

### 1. Clonar o repositório

```bash
git clone [https://github.com/robinhosilva30/user-consumer.git](https://github.com/robinhosilva30/user-consumer.git)
cd user-consumer
```

### 2. Configurar variáveis de ambiente
Crie o arquivo `.env` na raiz do projeto (se ele não existir) copiando o `.env.template`:

```bash
cp .env.template .env
```

### 3. Construir e iniciar os containers
Acesse o diretório consumer (`CD consumer`) e execute:

```bash
docker-compose up --build -d
```
- `up`: Inicia os serviços definidos no docker-compose.yml.
- `--build`: Constrói a imagem Docker para o serviço `consumer` (caso haja alterações ou seja a primeira vez).
- `-d`: Roda os containers em modo `detached` (em segundo plano).

Você pode verificar o status dos containers com:

```bash
docker-compose ps
```

---

## 🚀 Como usar / testar

### 1. Verificar os logs do consumer

Monitore os logs do seu serviço Node.js para ver o processamento das mensagens:

```bash
docker-compose logs consumer -f
```
Você deverá ver logs indicando que a mensagem foi recebida, enriquecida e persistida.

### 2. Verificar os Dados no MongoDB
Para confirmar que os dados foram persistidos, você pode acessar o shell do MongoDB:

```bash
docker exec -it user-consumer-mongodb-1 mongosh -u admin -p secret --authenticationDatabase admin
```
Dentro do shell do MongoDB, execute:
```js
use socialProfiles; // Acessar o banco de dados
db.users.find().pretty(); // users é o nome da coleção
```
Você deverá ver os dados dos usuários enviados para a fila e com os dados enriquecidos (LinkedIn e Github).

--- 

### 3. Acessar o RabbitMQ
Abra o seu navegador e acesse http://localhost:15672/
```
Username: guest
Password: guest
```

## 🛑 Parar os Serviços
Para parar e remover os containers:

```bash
docker-compose down
```

Se você quiser remover também os volumes de dados, use:

```bash
docker-compose down --volumes
```