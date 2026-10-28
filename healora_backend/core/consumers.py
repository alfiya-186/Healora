import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)

class TelehealthConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time WebSockets signaling consumer for WebRTC peer-to-peer telehealth sessions.
    Facilitates sub-millisecond SDP offer/answer exchange and ICE candidate trickle.
    """
    async def connect(self):
        self.appointment_id = self.scope['url_route']['kwargs'].get('appointment_id')
        if not self.appointment_id:
            await self.close(code=4000)
            return

        self.room_group_name = f"telehealth_{self.appointment_id}"

        # Join room group backed by Redis / Channel Layer
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        logger.info(f"[Telehealth WS] Client connected to room group '{self.room_group_name}' [channel: {self.channel_name}]")

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"[Telehealth WS] Client disconnected from room group '{self.room_group_name}' [code: {close_code}]")

    async def receive_json(self, content):
        """
        Receives signaling payloads from peer and broadcasts to the appointment room group.
        Expected format:
        {
            "type": "join" | "present" | "offer" | "answer" | "candidate" | "leave" | "chat",
            "payload": { ... },
            "senderName": "Dr. Sarah John",
            "role": "NUTRITIONIST" | "PATIENT"
        }
        """
        signal_type = content.get('type')
        payload = content.get('payload')
        sender_name = content.get('senderName', '')
        role = content.get('role', '')

        if not signal_type:
            return

        # Broadcast to all peers in the appointment room group, tagging the sender's channel
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'signal_message',
                'sender_channel_name': self.channel_name,
                'signal_type': signal_type,
                'payload': payload,
                'sender_name': sender_name,
                'role': role,
            }
        )

    async def signal_message(self, event):
        """
        Group broadcast handler. Delivers signal message to peers while omitting the sender.
        """
        # Suppress echo back to sender
        if event.get('sender_channel_name') == self.channel_name:
            return

        await self.send_json({
            'type': event.get('signal_type'),
            'payload': event.get('payload'),
            'sender_name': event.get('sender_name'),
            'role': event.get('role'),
        })

