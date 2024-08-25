const User = require('../module/ExpenseUser');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const addUser = async (req, res) => {
    try {
        const { name, email, password, cPassword } = req.body;
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(301).json({ Error: 'User already exists' })
        }
        if (password === cPassword) {
            const hashPwd = bcryptjs.hashSync(password);
            if (hashPwd) {
                const user = await User.create({ name, email, password: hashPwd, balance: 0, earn: 0, spend: 0 });
                return res.status(200).json(user);
            }
        }
        return res.status(301).json({ Error: "Passwords do not match" })

    }
    catch (err) {
        res.status(401).json({
            Error: err.message
        })
    }

}


const earnTranscations = async (req, res) => {
    try {
        const { email, transactions } = req.body;
        const { transactionAmt } = transactions[0];

        const user = await User.findOneAndUpdate({ email }, { $addToSet: { transactions } }, { new: true });

        if (!user) {
            return res.status(404).json({ Error: 'User not found' });
        }

        user.balance += Math.abs(transactionAmt);
        user.earn += Math.abs(transactionAmt);

        await user.save();
        res.status(200).json(user);

    } catch (err) {
        res.status(400).json({
            Error: err.message
        });
    }
}

const spendTranscations = async (req, res) => {
    try {
        const { email, transactions } = req.body;
        let { transactionName, transactionAmt } = transactions[0];
        transactionAmt = Math.abs(transactionAmt);
        transactionAmt = transactionAmt * -1;
        const user = await User.findOneAndUpdate({ email }, { $addToSet: { transactions: { transactionName, transactionAmt } } }, { new: true });

        if (!user) {
            return res.status(404).json({ Error: 'User not found' });
        }

        user.balance += transactionAmt;
        user.spend -= transactionAmt;
        await user.save();
        res.status(200).json(user);

    } catch (err) {
        res.status(400).json({
            Error: err.message
        });
    }
}

const getUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ Error: "User not found" });
        }
        if (!bcryptjs.compareSync(password, user.password)) {
            return res.status(404).json({ Error: "Incorrect password" });
        }

        res.status(200).json(user);
    }
    catch (err) {
        res.status(400).json({
            Error: err.message
        })
    }
}

const getTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ Error: "nothing found" });
        }
        await User.findById({ _id: id }).then((data) => {
            res.status(200).json(data.transactions);
        });
    }
    catch (err) {
        res.status(400).json({
            Error: err.message
        })
    }
}

const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ Error: "nothing found" });
        }
        await User.findById({ _id: id }).then((data) => {
            res.status(200).json(data);
        });
    }
    catch (err) {
        res.status(400).json({
            Error: err.message
        })
    }
}

const editUser = async (req, res) => {
    try {
        const { id, newName } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ Error: "nothing found" });
        }
        await User.findByIdAndUpdate({ _id: id }, { name: newName }).then((data) => {
            res.status(200).json(data);
        });
    }
    catch (err) {
        res.status(400).json({
            Error: err.message
        })
    }
}

// const editTransaction = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { transactionName } = req.body;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(404).json({ Error: "Invalid transaction ID" });
//         }

//         const user = await User.findOneAndUpdate(
//             { 'transactions._id': id },
//             { $set: { 'transactions.$.transactionName': transactionName } },
//             { new: true }
//         );

//         if (!user) {
//             return res.status(404).json({ Error: 'User not found' });
//         }

//         res.status(200).json(user);
//     } catch (err) {
//         console.error('Error editing transaction:', err);
//         res.status(400).json({
//             Error: err.message
//         });
//     }
// };

const editTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { transactionName, transactionAmt } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ Error: "Invalid transaction ID" });
        }

        // Find the user by the transaction ID in the transactions array
        const user = await User.findOne({ 'transactions._id': id });

        if (!user) {
            return res.status(404).json({ Error: 'User not found' });
        }

        // Update the transaction details
        const transactionIndex = user.transactions.findIndex((t) => t._id.toString() === id);
        if (transactionIndex !== -1) {
            // Update transaction name and amount
            user.transactions[transactionIndex].transactionName = transactionName;
            user.transactions[transactionIndex].transactionAmt = transactionAmt;
        }

        // Recalculate user values based on transactions
        user.balance = user.transactions.reduce((total, t) => total + t.transactionAmt, 0);
        user.earn = user.transactions.filter((t) => t.transactionAmt > 0).reduce((total, t) => total + t.transactionAmt, 0);
        user.spend = Math.abs(user.transactions.filter((t) => t.transactionAmt < 0).reduce((total, t) => total + t.transactionAmt, 0));

        // Save the updated user
        await user.save();

        res.status(200).json(user);
    } catch (err) {
        console.error('Error editing transaction:', err);
        res.status(400).json({
            Error: err.message
        });
    }
};


// const deleteTransaction = async (req, res) => {
//     try {
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(404).json({ Error: "Invalid transaction ID" });
//         }

//         // Find the user by the transaction ID in the transactions array
//         const user = await User.findOne({ 'transactions._id': id });

//         if (!user) {
//             return res.status(404).json({ Error: 'User not found' });
//         }

//         // Remove the transaction from the array
//         user.transactions.pull(id);

//         // Save the updated user
//         await user.save();

//         res.status(200).json(user);
//     } catch (err) {
//         console.error('Error deleting transaction:', err);
//         res.status(400).json({
//             Error: err.message
//         });
//     }
// };
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ Error: "Invalid transaction ID" });
        }

        // Find the user by the transaction ID in the transactions array
        const user = await User.findOne({ 'transactions._id': id });

        if (!user) {
            return res.status(404).json({ Error: 'User not found' });
        }

        // Remove the transaction from the array
        user.transactions.pull(id);

        // Recalculate user values based on transactions
        user.balance = user.transactions.reduce((total, t) => total + t.transactionAmt, 0);
        user.earn = user.transactions.filter((t) => t.transactionAmt > 0).reduce((total, t) => total + t.transactionAmt, 0);
        user.spend = Math.abs(user.transactions.filter((t) => t.transactionAmt < 0).reduce((total, t) => total + t.transactionAmt, 0));

        // Save the updated user
        await user.save();

        res.status(200).json(user);
    } catch (err) {
        console.error('Error deleting transaction:', err);
        res.status(400).json({
            Error: err.message
        });
    }
};


// ------------


module.exports = {
    addUser, earnTranscations, spendTranscations, getUserDetails, getUser, getTransaction, editTransaction, deleteTransaction
}