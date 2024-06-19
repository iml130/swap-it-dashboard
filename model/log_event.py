# SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
# SPDX-License-Identifier: MIT

import json


class LogEvent:
    def __init__(
        self,
        log_id: str = None,
        log_date: str = None,
        log_message: str = None,
        log_level: int = None,
    ):
        self.order_id = log_id
        self.log_date = log_date
        self.log_message = log_message
        self.log_level = log_level

    def toJson(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
