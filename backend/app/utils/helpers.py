# Placeholder
from bson import ObjectId


def serialize_mongo(document):

    if document:

        document["_id"] = str(document["_id"])

    return document