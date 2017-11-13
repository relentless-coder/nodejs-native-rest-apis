import {connectMongo} from "../../config/mongodb.config";
import {ErrorWithStatusCode} from "../../handlers/error.handler";

function findAll(collection, query, resClass, dummy) {
    let model;
    const queryCollection = (db)=>{
        model  = db;
        let query = query ? query : {};
        let docs = model.collection(collection);
        return docs.find(query).then(data=>data).catch(err=>err)
    };

    const populateResService = (docs)=>{
        let data = [];
        docs.forEach((doc)=>{
            data.push(new resClass(doc))
        });

        return data;
    };

    const sendResponse = (data)=>{
        model.close();
        return {
            data,
            message: 'Documents query successful',
            status: 200
        }
    };

    return connectMongo(dummy).then(queryCollection).then(populateService).then(sendResponse).catch((err)=>{
        model.close();
        return {
            status: 500,
            message: 'Sorry, we seem to be facing some issue right now. Please try agaiin later.',
            error: err
        }
    })
}

function findOne(collection, query, resClass, dummy) {
    if(!(!collection && !query && !resClass)){
        throw new ErrorWithStatusCode(422, 'Can\'t process request with incomplete data.', 'You haven\'t passed the required params to this function. Kindly, make sure the function is called with all the params mentioned in the document.')
    }
    let model;
    const queryCollection = (db)=>{
        model  = db;
        let query = query ? query : {};
        let docs = model.collection(collection);
        return docs.findOne(query).then(data=>data).catch(err=>err);
    };

    const populateResService = (docs)=>{
        let data = [];
        docs.forEach((doc)=>{
            data.push(new resClass(doc))
        });

        return data;
    };

    const sendResponse = (data)=>{
        model.close();
        return {
            data,
            message: 'Document query successful',
            status: 200
        }
    };

    return connectMongo(dummy).then(queryCollection).then(populateResService).then(sendResponse).catch((err)=>{
        model.close();
        return {
            status: 500,
            message: 'Sorry, we seem to be facing some issue right now. Please try again later.',
            error: err
        }
    })
}

function insert(collection, doc, reqClass, resClass, dummy) {
    let model;
    let isArray = false;

    if(!(!collection && !doc && !reqClass && !resClass)){
        throw new ErrorWithStatusCode(422, 'Can\'t process request with incomplete data.', 'You haven\'t passed the required params to this function. Kindly, make sure the function is called with all the params mentioned in the document.')
    }

    if(Object.keys(doc).length === 0 || (Object.keys(doc).length === 1 && doc._id)){
        throw new ErrorWithStatusCode(400, 'Inserting empty documents is not allowed.', 'You tried to pass ' +
            'empty document to the database. This will pollute your database. Kindly, try again with at least one' +
            ' value other than _id.')
    }

    const populateReqService = (db)=>{
        model = db;
        if(Array.isArray(doc)){
            let requestData = [];
            isArray = true;
            doc.forEach((el)=>{
                requestData.push(new reqClass(el))
            });

            return requestData

        } else {
            return new reqClass(doc)
        }
    };

    const insertDocument = (docs)=>{
        let localCollection = model.collection(collection);

        if(isArray){
            return localCollection.insertMany(docs).then(data=>data).catch(err=>err)
        } else {
            return localCollection.insertOne(docs).then(data=>data).catch(err=>err)
        }
    };

    const populateResService = (result)=>{
        if(Array.isArray(result.ops)){
            let data = [];
            result.ops.forEach((el)=>{
                data.push(new resClass(el))
            });

            return data;
        } else {
            return new resClass(result.ops);
        }
    };

    const sendResponse = (data)=>{
        model.close();
        return {
            data,
            message: 'Document inserted successfully',
            status: 200
        }
    };

    return connectMongo(dummy).then(populateReqService).then(insertDocument).then(populateResService).then(sendResponse).catch((err)=>{
        model.close();
        return {
            status: 500,
            message: 'Sorry, we seem to be facing some issue right now. Please try again later.',
            error: err
        }
    })
}

function update(collection, query, body, resClass, dummy) {
    let model;

    if(!body){
        return {
            status: 400,
            message: 'Updating with empty object is not allowed.',
            err: 'You were trying to update the existing document with an empty object, ' +
            'it would completely replace your document with empty values.'
        }
    }

    const updateDocument = (db)=>{
        model = db;

        let localCollection = model.collection(collection);

        return localCollection.updateOne(query, body).then(data=>data)
    };

    const queryDocument = ()=>{
        let localCollection = model.collection(collection);

        return localCollection.findOne(query).then(data=>data).catch(err=>err);
    };

    const populateResService = (doc)=>{
        return new resClass(doc)
    };

    const sendResponse = (data)=>{
        model.close();
        return {
            data,
            message: 'Document updated successfully',
            status: 200
        }
    };

    connectMongo(dummy).then(updateDocument).then(queryDocument).then(populateResService).then(sendResponse).catch((err)=>{
        return {
            status: 500,
            message: 'Sorry, we seem to be facing some issue right now. Please try again later.',
            error: err
        }
    })
}

export {findAll, findOne, insert, update}