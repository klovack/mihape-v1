# Mihape Transfer

An old project which can be seen on [Mihape Transfer Website](http://transfer.mihape.com)

API Endpoint for web based application to transfer money from Indonesia to Germany

### Version
1.0.0

## API
### User
JWT and Authorization header is needed with the bearer 'JWT-transfer' for some of the routes
- `GET /api/v1/user` Get the profile of the user.
- `POST /api/v1/user/register` Register new user.
- `GET /api/v1/user/confirm/:token` Confirm Email with the  specify token.
- `POST /api/v1/user/confirm` Send email to be confirmed.
- `POST /api/v1/user/login` Log in user and get token.
- `GET /api/v1/user/logout` Log out user.

### Rates
- `GET /api/v1/rates` Get exchange rates from EUR.
Query: 
  - `amount` Number of money to be converted
  - `base` Base Currency (EUR, USD, IDR)
  - `destination` Destination Currency (EUR, USD, IDR)
  - `include_fee` Whether include fee in the amount or not

### Recipient
All routes need JWT and Authorization header is needed with the bearer 'JWT-transfer' for some of the routes
- `GET /api/v1/recipients` Get all of the recipients which belong to the user
- `POST /api/v1/recipients` Create new recipient
- `DELETE /api/v1/recipients/:id` Delete recipient with specified id
- `GET /api/v1/recipients/:id` Get recipient with specified id

### Transaction
All routes need JWT and Authorization header is needed with the bearer 'JWT-transfer' for some of the routes
- `GET /api/v1/transactions` Get all of the transactions which belong to the user
- `POST /api/v1/transactions` Create new transaction
- `GET /api/v1/transactions/:id` Get recipient with specified id
- `DELETE /api/v1/transactions/:id` Set the transaction's status to be IS_CANCELED
- `PUT /api/v1/transactions/:id` Edit the recipient, name, or description of the transaction