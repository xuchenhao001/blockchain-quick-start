// Written by Xu Chen Hao
package main

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

var commonPrefix = "Common@"

func (s *SmartContract) uploadCommon(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return s.returnError("Wrong number of parameters, need key & value")
	}

	logger.Debugf("Got request parameters: [key] %s, [value] %s", args[0], args[1])

	key := args[0]
	valueAsByte := []byte(args[1])

	// 数据上链
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

