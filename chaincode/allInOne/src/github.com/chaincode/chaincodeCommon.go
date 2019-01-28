// Written by Xu Chen Hao
package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

var commonPrefix = ""

type BatchData struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

func (s *SmartContract) uploadCommon(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return s.returnError("Wrong number of parameters, need key & value")
	}

	logger.Debugf("Got request parameters: [key] %s, [value] %s", args[0], args[1])

	key := args[0]
	valueAsByte := []byte(args[1])

	logger.Debug("Write value on chain: " + string(valueAsByte))
	commonKey := commonPrefix + key
	err := APIstub.PutState(commonKey, valueAsByte)
	if err != nil {
		return s.returnError("Data write to chain failed: " + err.Error())
	}

	return shim.Success(nil)

}

func (s *SmartContract) queryCommon(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("Wrong number of parameters, need query key")
	}

	key := args[0]
	logger.Debug("Query common on chain: " + key)
	commonKey := commonPrefix + key
	result, err := APIstub.GetState(commonKey)
	if err != nil {
		return s.returnError("Query failed: " + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) batchUploadCommon(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	logger.Debugf("Got %d args for bach upload.", len(args))

	for _, arg := range args {
		var batchData BatchData
		json.Unmarshal([]byte(arg), &batchData)
		key := batchData.Key
		valueAsByte := []byte(batchData.Value)

		logger.Debugf("Write [key] %s [value] %s on chain: ", key, string(valueAsByte))
		err := APIstub.PutState(key, valueAsByte)
		if err != nil {
			return shim.Error("Data [key] " + key + " write to chain failed: " + err.Error())
		}
	}
	return shim.Success(nil)
}

func (s *SmartContract) batchQueryCommon(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	logger.Debugf("Got %d args for bach query.", len(args))

	var batch []BatchData
	for _, key := range args {
		logger.Debug("Query common on chain: " + key)
		valueAsByte, err := APIstub.GetState(key)
		if err != nil {
			return s.returnError("Query failed: " + err.Error())
		}
		var batchData BatchData
		batchData.Key = key
		batchData.Value = string(valueAsByte)
		batch = append(batch, batchData)
	}
	batchAsByte, err := json.Marshal(batch)
	if err != nil {
		return shim.Error("Marshal query result failed: " + err.Error())
	}

	return shim.Success(batchAsByte)

}

func (s *SmartContract) queryCommonHistory(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("Wrong number of parameters, need query key")
	}

	key := args[0]
	logger.Debug("Query history on chain: " + key)
	commonKey := commonPrefix + key
	result, err := s.queryHistoryAsset(APIstub, commonKey)
	if err != nil {
		return s.returnError("Query failed: " + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) richQueryCommon(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) == 1 {

		// rich query without pagination
		queryString := args[0]
		logger.Debug("Rich query on chain: " + queryString)
		result, err := s.richQuery(APIstub, queryString)
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
		logger.Debugf("Rich query %s with pagination ( page size %s, bookmark %s )",
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
