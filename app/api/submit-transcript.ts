import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { transcript } = req.body;

        // 서버에서 추가적인 처리 로직을 작성
        // 예: 데이터베이스에 저장, NLP 서버로 전송 등

        res.status(200).json({ message: 'Transcript received', transcript });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
