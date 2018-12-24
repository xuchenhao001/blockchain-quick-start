// Written by Xu Chen Hao
package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

type Manifest struct {
	Shipper           string `json:"shipper"`
	Consignee         string `json:"consignee"`
	FromPort          string `json:"fromPort"`
	DespPortCode      string `json:"despPortCode"`
	DespPort          string `json:"despPort"`
	Freight           string `json:"freight"`
	DistinatePortCode string `json:"distinatePortCode"`
	MasterBillNo      string `json:"masterBillNo"`
	ToPort            string `json:"toPort"`
	DistinatePort     string `json:"distinatePort"`
	Pack              string `json:"pack"`
	LanguageIdentity  string `json:"languageIdentity"`
	Ata               string `json:"ata"`
	Atd               string `json:"atd"`
	Carrier           string `json:"carrier"`
	GrossWeight       string `json:"grossWeight"`
	NetWeight         string `json:"netWeight"`
	FlightNo          string `json:"flightNo"`
	Measure           string `json:"measure"`
	ToPortCode        string `json:"toPortCode"`
	Mark              string `json:"mark"`
	PackNo            string `json:"packNo"`
	WeightCode        string `json:"weightCode"`
}

func (s *SmartContract) validateManifest(manifest Manifest) bool {

	//TODO define some validate conditions
	return true
}

func (s *SmartContract) writeChainManifest(APIstub shim.ChaincodeStubInterface, manifest Manifest) error {
	manifestAsBytes, err := json.Marshal(manifest)
	if err != nil {
		return err
	}
	logger.Debug("Write manifest on chain: " + string(manifestAsBytes))
	manifestKey, err := APIstub.CreateCompositeKey("Manifest@", []string{manifest.MasterBillNo})
	err = APIstub.PutState(manifestKey, manifestAsBytes)
	if err != nil {
		return err
	}
	return nil
}

func (s *SmartContract) uploadManifest(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	logger.Debug("获取请求参数: " + args[0])

	manifestAsBytes := []byte(args[0])
	var manifest Manifest
	err := json.Unmarshal(manifestAsBytes, &manifest)
	if err != nil {
		return s.returnError("主舱单格式错误: " + err.Error())
	}

	// 验证主舱单是否合法
	if !s.validateManifest(manifest) {
		return s.returnError("主舱单不合法")
	}

	// 数据上链
	err = s.writeChainManifest(APIstub, manifest)
	if err != nil {
		return s.returnError("主舱单上链失败: " + err.Error())
	}

	return shim.Success(manifestAsBytes)

}

func (s *SmartContract) queryManifest(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	masterBillNo := args[0]
	logger.Debug("Query manifest on chain: " + masterBillNo)
	manifestKey, err := APIstub.CreateCompositeKey("Manifest@", []string{masterBillNo})
	result, err := APIstub.GetState(manifestKey)
	if err != nil {
		return s.returnError("主舱单查询失败" + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) queryManifestHistory(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	masterBillNo := args[0]
	logger.Debug("Query history on chain: " + masterBillNo)
	manifestKey, err := APIstub.CreateCompositeKey("Manifest@", []string{masterBillNo})
	result, err := s.queryHistoryAsset(APIstub, manifestKey)
	if err != nil {
		return s.returnError("主舱单查询失败" + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) richQueryManifest(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

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
		return s.returnError("参数数量不正确")
	}
}

