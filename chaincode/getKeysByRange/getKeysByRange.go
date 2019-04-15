// Written by Xu Chen Hao
package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

var logger = shim.NewLogger("chaincode")

type Data struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type History struct {
	TxId      string `json:"txId"`
	Value     string `json:"value"`
	Timestamp string `json:"timestamp"`
	IsDelete  bool   `json:"isDelete"`
}

type PaginationMetadata struct {
	FetchedRecordsCount int32  `json:"fetched_records_count"`
	Bookmark            string `json:"bookmark"`
}

type RichQueryPaginResult struct {
	PaginationMetadata PaginationMetadata `json:"pagination_metadata"`
	Data               []Data             `json:"data"`
}

// Define the Smart Contract structure
type SmartContract struct {
}

type R_Err struct {
	Reason string `json:"reason"`
}

func (s *SmartContract) returnError(reason string) sc.Response {

	var re R_Err

	re.Reason = reason
	logger.Error(re.Reason)
	reAsBytes, _ := json.Marshal(re)

	return shim.Success(reAsBytes)
}

func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "upload" {
		return s.upload(APIstub, args)
	} else if function == "query" {
		return s.query(APIstub, args)
	} else if function == "batchUpload" {
		return s.batchUpload(APIstub, args)
	} else if function == "batchQuery" {
		return s.batchQuery(APIstub, args)
	} else if function == "queryHistory" {
		return s.queryHistory(APIstub, args)
	} else if function == "richQuery" {
		return s.richQuery(APIstub, args)
	} else if function == "queryByRange" {
		return s.queryByRange(APIstub, args)
	}

	return s.returnError("Invalid Smart Contract function name.")
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		logger.Error("Error creating new Smart Contract: %s", err)
	}
}

func (s *SmartContract) upload(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 2 {
		return s.returnError("Wrong number of parameters, need key & value")
	}

	logger.Debugf("Got upload parameters: [key] %s, [value] %s", args[0], args[1])

	key := args[0]
	valueAsByte := []byte(args[1])

	err := APIstub.PutState(key, valueAsByte)
	if err != nil {
		return s.returnError("Data write to chain failed: " + err.Error())
	}

	logger.Debugf("Data wrote successfully: [key] %s, [value] %s", key, string(valueAsByte))

	return shim.Success(nil)
}

func (s *SmartContract) query(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return s.returnError("Wrong number of parameters, need key for query")
	}

	logger.Debugf("Got query parameter: [key] %s" + args[0])

	key := args[0]

	valueAsByte, err := APIstub.GetState(key)
	if err != nil {
		return s.returnError("Query failed: " + err.Error())
	}

	logger.Debugf("Data queried successfully: [key] %s, [value] %s", key, string(valueAsByte))

	return shim.Success(valueAsByte)
}

func (s *SmartContract) batchUpload(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	logger.Debugf("Got %d args for bach upload.", len(args))

	for _, arg := range args {
		var batchData Data
		err := json.Unmarshal([]byte(arg), &batchData)
		if err != nil {
			return shim.Error("Arg [" + arg + "] unmarshal to json failed: " + err.Error())
		}
		key := batchData.Key
		valueAsByte := []byte(batchData.Value)

		err = APIstub.PutState(key, valueAsByte)
		if err != nil {
			return shim.Error("Data [key] " + key + " [value] " + string(valueAsByte) +
				" write failed: " + err.Error())
		}
		logger.Debugf("Data wrote successfully: [key] %s, [value] %s", key, string(valueAsByte))
	}
	return shim.Success(nil)
}

func (s *SmartContract) batchQuery(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	logger.Debugf("Got %d args for bach query.", len(args))

	var batch []Data
	for _, key := range args {
		logger.Debugf("Got batch query parameter: [key] %s" + args[0])
		valueAsByte, err := APIstub.GetState(key)
		if err != nil {
			return s.returnError("Query failed: " + err.Error())
		}
		logger.Debugf("Data queried successfully: [key] %s, [value] %s: ", key, string(valueAsByte))

		var batchData Data
		batchData.Key = key
		batchData.Value = string(valueAsByte)
		batch = append(batch, batchData)
	}
	batchAsByte, err := json.Marshal(batch)
	if err != nil {
		return shim.Error("Marshal query result failed: " + err.Error())
	}

	logger.Debugf("Data batch queried successfully: [value] %s", string(batchAsByte))
	return shim.Success(batchAsByte)
}

func (s *SmartContract) queryHistory(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return s.returnError("Wrong number of parameters, need key for query")
	}

	key := args[0]
	logger.Debugf("Got query history parameter: [key] %s" + args[0])
	result, err := s.queryHistoryAsset(APIstub, key)
	if err != nil {
		return s.returnError("Query history failed: " + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) queryHistoryAsset(stub shim.ChaincodeStubInterface, key string) ([]byte, error) {
	historyIter, err := stub.GetHistoryForKey(key)
	defer historyIter.Close()
	if err != nil {
		return nil, err
	}

	var historyArray []History

	for historyIter.HasNext() {
		historyItem, err := historyIter.Next()
		if err != nil {
			return nil, err
		}

		var history History
		history.TxId = historyItem.TxId
		history.Timestamp = historyItem.Timestamp.String()
		history.Value = string(historyItem.Value)
		history.IsDelete = historyItem.IsDelete
		historyArray = append(historyArray, history)
	}

	historyAsByte, err := json.Marshal(historyArray)
	if err != nil {
		return nil, err
	}

	logger.Debugf("History data queried successfully: [key] %s, [value] %s", key, string(historyAsByte))

	return historyAsByte, nil
}

func (s *SmartContract) richQuery(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) == 1 {
		// rich query without pagination
		queryString := args[0]
		logger.Debug("Got 1 parameter, try to rich query simple: " + queryString)
		result, err := s.richQuerySimple(APIstub, queryString)
		if err != nil {
			return s.returnError("Rich query failed: " + err.Error())
		}
		return shim.Success(result)
	} else if len(args) == 3 {
		// rich query with pagination
		queryString := args[0]
		pageSize, err := strconv.ParseInt(args[1], 10, 32)
		if err != nil {
			return s.returnError("Error convert arg 2 to int32: " + err.Error())
		}
		bookmark := args[2]
		logger.Debugf("Rich query [queryString] %s with pagination (page size %s, bookmark %s)",
			queryString, pageSize, bookmark)
		result, err := s.richQueryWithPagination(APIstub, queryString, int32(pageSize), bookmark)
		if err != nil {
			return s.returnError("Rich query failed: " + err.Error())
		}
		return shim.Success(result)
	} else {
		return s.returnError("Wrong number of parameters, need 1 arg (rich query string) or 3 args " +
			"(rich query string & page size & bookmark).")
	}
}

func (s *SmartContract) richQuerySimple(stub shim.ChaincodeStubInterface, queryString string) ([] byte, error) {

	logger.Debugf("Got rich query parameter: [queryString] %s", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	defer resultsIterator.Close()
	if err != nil {
		return nil, err
	}

	var queryResultArray []Data
	for resultsIterator.HasNext() {
		queryResultItem, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var queryResult Data
		queryResult.Key = queryResultItem.Key
		queryResult.Value = string(queryResultItem.Value)
		queryResultArray = append(queryResultArray, queryResult)
	}

	queryResultBytes, err := json.Marshal(queryResultArray)
	if err != nil {
		return nil, err
	}

	logger.Debugf("Data rich queried successfully: [queryString] %s, [value] %s",
		queryString, string(queryResultBytes))
	return queryResultBytes, nil
}

func (s *SmartContract) richQueryWithPagination(stub shim.ChaincodeStubInterface, queryString string, pageSize int32,
	bookmark string) ([] byte, error) {

	logger.Debugf("Got rich query parameter: [queryString] %s, [pageSize] %s, [bookmark] %s", queryString,
		pageSize, bookmark)

	resultsIterator, responseMetadata, err := stub.GetQueryResultWithPagination(queryString, pageSize, bookmark)
	defer resultsIterator.Close()
	if err != nil {
		return nil, err
	}

	var queryResultArray []Data
	for resultsIterator.HasNext() {
		queryResultItem, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var queryResult Data
		queryResult.Key = queryResultItem.Key
		queryResult.Value = string(queryResultItem.Value)
		queryResultArray = append(queryResultArray, queryResult)
	}

	var richQueryPaginResult RichQueryPaginResult
	var paginationMetadata PaginationMetadata
	paginationMetadata.Bookmark = responseMetadata.Bookmark
	paginationMetadata.FetchedRecordsCount = responseMetadata.FetchedRecordsCount
	richQueryPaginResult.PaginationMetadata = paginationMetadata
	richQueryPaginResult.Data = queryResultArray

	queryResultBytes, err := json.Marshal(richQueryPaginResult)
	if err != nil {
		return nil, err
	}

	logger.Debugf("Data rich queried successfully: [queryString] %s, [value] %s",
		queryString, string(queryResultBytes))

	return queryResultBytes, nil
}

func (s *SmartContract) queryByRange(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 2 {
		return s.returnError("Wrong number of parameters, need start startKey and end startKey for query")
	}

	logger.Debugf("Got query parameter: [start key] %s, [end key] %s" + args[0], args[1])

	startKey := args[0]
	endKey := args[1]

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	defer resultsIterator.Close()
	if err != nil {
		return s.returnError("Query failed: " + err.Error())
	}

	var queryResultArray []Data
	for resultsIterator.HasNext() {
		queryResultItem, err := resultsIterator.Next()
		if err != nil {
			return s.returnError("Fetch next result failed: " + err.Error())
		}

		var queryResult Data
		queryResult.Key = queryResultItem.Key
		queryResult.Value = string(queryResultItem.Value)
		queryResultArray = append(queryResultArray, queryResult)
	}

	queryResultBytes, err := json.Marshal(queryResultArray)
	if err != nil {
		return s.returnError("Marshal final result to array failed: " + err.Error())
	}

	logger.Debugf("Data range queried successfully: [start key] %s, [end key] %s, [value] %s",
		startKey, endKey, string(queryResultBytes))

	return shim.Success(queryResultBytes)
}
