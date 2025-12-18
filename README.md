# 💸Expense Sharing Application Backend

A backend system designed to manage shared expenses within groups. The application supports group creation, multiple expense-splitting strategies, automated balance tracking, and settlement of dues. It is built using Node.js, Express.js, and MongoDB, with a focus on clean API design, accurate business logic, and scalable backend architecture.


## Features

- **User Management**: Create and manage users
- **Group Management**: Create groups and add/remove members
- **Expense Tracking**: Add expenses with multiple split types
  - Equal split: Divide equally among participants
  - Exact amount split: Specify exact amounts for each participant
  - Percentage split: Split by percentage shares
- **Balance Tracking**: Automatically track who owes whom
- **Balance Simplification**: Minimize transactions using optimization algorithm
- **Settlement**: Record payments between users

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```


2. Create a `.env` file in the project root:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/expense-sharing
```

3. Start the server:
```bash
npm run server
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Users

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Groups

- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get group by ID
- `POST /api/groups/:id/members` - Add member to group
- `DELETE /api/groups/:id/members/:userId` - Remove member from group

### Expenses

- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/group/:groupId` - Get all expenses for a group
- `GET /api/expenses/:id` - Get expense by ID
- `DELETE /api/expenses/:id` - Delete expense

### Balances

- `GET /api/balances/user/:userId/group/:groupId` - Get user balances in a group
- `GET /api/balances/group/:groupId` - Get all balances in a group (simplified)
- `POST /api/balances/settle` - Settle a debt between users
- `GET /api/balances/settlements/group/:groupId` - Get settlement history

## Usage Examples

**Important:**  
Replace `USER_ID_ALICE`, `USER_ID_BOB`, and `GROUP_ID` with the actual MongoDB ObjectIds returned by the API responses.  

### 1. Create Users

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "email": "bob@example.com"}'
```

### 2. Create a Group

```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Apartment Roommates",
    "description": "Shared expenses for apartment",
    "members": ["USER_ID_ALICE", "USER_ID_BOB"],
    "createdBy": "USER_ID_ALICE"
  }'
```

### 3. Add an Equal Split Expense

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Groceries",
    "amount": 100,
    "group": "GROUP_ID",
    "paidBy": "USER_ID_ALICE",
    "splitType": "equal"
  }'
```

### 4. Add an Exact Split Expense

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Dinner",
    "amount": 150,
    "group": "GROUP_ID",
    "paidBy": "USER_ID_ALICE",
    "splitType": "exact",
    "participants": [
      {"user": "USER_ID_ALICE", "amount": 60},
      {"user": "USER_ID_BOB", "amount": 90}
    ]
  }'
```

### 5. Add a Percentage Split Expense

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Rent",
    "amount": 2000,
    "group": "GROUP_ID",
    "paidBy": "USER_ID_ALICE",
    "splitType": "percentage",
    "participants": [
      {"user": "USER_ID_ALICE", "percentage": 40},
      {"user": "USER_ID_BOB", "percentage": 60}
    ]
  }'
```

### 6. Get User Balances

```bash
curl http://localhost:3000/api/balances/user/USER_ID_BOB/group/GROUP_ID
```

### 7. Get Simplified Group Balances

```bash
curl http://localhost:3000/api/balances/group/GROUP_ID
```

### 8. Settle a Debt

```bash
curl -X POST http://localhost:3000/api/balances/settle \
  -H "Content-Type: application/json" \
  -d '{
    "group": "GROUP_ID",
    "paidBy": "USER_ID_BOB",
    "paidTo": "USER_ID_ALICE",
    "amount": 50
  }'
```

## Project Structure

```
├── server.js               # Express server setup
├── models/
│   ├── User.js            # User schema
│   ├── Group.js           # Group schema
│   ├── Expense.js         # Expense schema
│   ├── Balance.js         # Balance tracking schema
│   └── Settlement.js      # Settlement history schema
├── routes/
│   ├── userRoutes.js      # User endpoints
│   ├── groupRoutes.js     # Group endpoints
│   ├── expenseRoutes.js   # Expense endpoints
│   └── balanceRoutes.js   # Balance & settlement endpoints
├── services/
│   ├── expenseService.js  # Expense splitting logic
│   └── balanceService.js  # Balance calculation & simplification
├── package.json
└── README.md
```

## Key Features Explained

### Balance Tracking

Balances are automatically updated when expenses are created. The system maintains a map of who owes whom for each user in each group.

### Balance Simplification

The system uses a greedy algorithm to minimize the number of transactions needed to settle all debts. For example, if A owes B $50 and B owes C $50, it simplifies to A paying C $50 directly.

### Split Types

1. **Equal**: Divides the expense equally among all participants
2. **Exact**: Each participant pays a specific amount (must sum to total)
3. **Percentage**: Each participant pays a percentage (must sum to 100%)

## Testing

You can test the API using tools like Postman, cURL, or any HTTP client. The examples above demonstrate the basic workflow.

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Future Enhancements

- Authentication & authorization
- Recurring expenses
- Expense categories
- Currency support
- Email notifications
- Mobile app integration

## Contact

For any questions or suggestions, feel free to contact me:<br>
Rajat Kumar<br>
rajatkumar020304@gmail.com