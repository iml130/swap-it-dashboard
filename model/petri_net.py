# SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
# SPDX-License-Identifier: MIT


class PetriNet:
    def __init__(self, order_id: str = None, content: str = None, type: str = None):

        self.order_id = order_id
        self.content = content
        self.type = type
