from app.db.database import Base, engine
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        from unittest.mock import patch
        
        with patch('app.models.geochat.GeoChatModel.load', return_value=None), \
             patch('app.models.geochat.GeoChatModel.is_loaded', return_value=True), \
             patch('app.models.geochat.GeoChatModel._run_inference', return_value={'text': 'Mock answer', 'confidence': {'score': 0.9, 'level': 'HIGH'}, 'evidence': []}), \
             patch('app.models.geochat.GeoChatModel.answer_vqa', return_value='A river and a forest.'):
             
             with open('test.png', 'wb') as f:
                 f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01\x00\x00\x00\x01\x00\x08\x02\x00\x00\x00\xd3\x10?1\x00\x00\x02\xbfIDA\x00\x00\x00\x00IEND\xaeB`\x82')
             files = [('files', ('test.png', open('test.png', 'rb'), 'image/png'))]
             data = {'query': 'What is here?'}
             res = await client.post('/api/analysis/', files=files, data=data)
             print('POST STATUS:', res.status_code)
             try:
                 print('POST JSON:', res.json())
             except:
                 pass

asyncio.run(test())
