const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // JSONボディのパース

AWS.config.update({ region: 'ap-northeast-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'kjtxt-translate-tb';

// POST API: skj, jkj を受け取り、重複チェック後に登録
app.post('/kjtxt', async (req, res) => {
    const { skj, jkj } = req.body;

    if (!skj || !jkj) {
        return res.status(400).json({ error: "Missing 'skj' or 'jkj' parameter" });
    }

    try {
        // 重複チェック
        const getParams = {
            TableName: tableName,
            Key: { skj }
        };
        const getResult = await dynamodb.get(getParams).promise();

        if (getResult.Item) {
            return res.status(500).json("record already exists");
        }

        // 登録処理
        const putParams = {
            TableName: tableName,
            Item: { skj, jkj }
        };
        const putResult = await dynamodb.put(putParams).promise();

        if (putResult && putResult.$response.httpResponse.statusCode === 200) {
            return res.status(200).json("record add successful");
        } else {
            return res.status(500).json("dynamodb error");
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
