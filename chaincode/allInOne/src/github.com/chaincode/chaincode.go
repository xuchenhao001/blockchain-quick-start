// Written by Xu Chen Hao
package main

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric/bccsp"
	"github.com/hyperledger/fabric/bccsp/factory"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("chaincode")

// Define the Smart Contract structure
type SmartContract struct {
	bccspInst bccsp.BCCSP
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
	// chaincode A - upload manifest
	if function == "uploadPO" {
		return s.uploadPO(APIstub, args)
	} else if function == "queryPO" {
		return s.queryPO(APIstub, args)
	} else if function == "queryPOHistory" {
		return s.queryPOHistory(APIstub, args)
	} else if function == "richQueryPO" {
		return s.richQueryPO(APIstub, args)
	} else

	// chaincode B - upload manifest
	if function == "uploadManifest" {
		return s.uploadManifest(APIstub, args)
	} else if function == "queryManifest" {
		return s.queryManifest(APIstub, args)
	} else if function == "queryManifestHistory" {
		return s.queryManifestHistory(APIstub, args)
	} else if function == "richQueryManifest" {
		return s.richQueryManifest(APIstub, args)
	} else

	// chaincode Common - upload common data
	if function == "uploadCommon" {
		return s.uploadCommon(APIstub, args)
	} else if function == "queryCommon" {
		return s.queryCommon(APIstub, args)
	} else if function == "queryCommonHistory" {
		return s.queryCommonHistory(APIstub, args)
	} else if function == "richQueryCommon" {
		return s.richQueryCommon(APIstub, args)
	} else if function == "batchUploadCommon" {
		return s.batchUploadCommon(APIstub, args)
	} else if function == "batchQueryCommon" {
		return s.batchQueryCommon(APIstub, args)
	} else if function == "queryCommonByRange" {
		return s.queryCommonByRange(APIstub, args)
	} else

	// chaincode Encrypt
	if function == "uploadPOEncAll" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		}
		return s.uploadPOEncrypt(APIstub, args, tMap[ENCKEY], tMap[IV], false, false)

	} else if function == "queryPODecAll" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		}
		return s.queryPODecrypt(APIstub, args, tMap[DECKEY], tMap[IV], false, false)

	} else if function == "uploadPOEncPart" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		}
		return s.uploadPOEncrypt(APIstub, args, tMap[ENCKEY], tMap[IV], true, false)

	} else if function == "queryPODecPart" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		}
		return s.queryPODecrypt(APIstub, args, tMap[DECKEY], tMap[IV], true, false)
	} else if function == "uploadPOEncPartSign" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		} else if _, in := tMap[SIGKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient key %s", SIGKEY))
		}
		return s.uploadPOEncrypt(APIstub, args, tMap[ENCKEY], tMap[SIGKEY], true, true)

	} else if function == "queryPODecPartVerify" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		} else if _, in := tMap[VERKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient key %s", VERKEY))
		}
		return s.queryPODecrypt(APIstub, args, tMap[DECKEY], tMap[VERKEY], true, true)
	} else
	// chaincode common Encrypt
	if function == "uploadEncAll" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		}
		return s.uploadEncrypt(APIstub, args, tMap[ENCKEY], tMap[IV])
	} else if function == "queryDecAll" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		}
		return s.queryDecrypt(APIstub, args, tMap[DECKEY], tMap[IV])
	} else
	// chaincode common batch Encrypt
	if function == "uploadEncryptBatch" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		}
		return s.uploadEncryptBatch(APIstub, args, tMap[ENCKEY], tMap[IV])
	} else if function == "queryDecryptBatch" {
		tMap, err := APIstub.GetTransient()
		if err != nil {
			return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
		}
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		}
		return s.queryDecryptBatch(APIstub, args, tMap[DECKEY], tMap[IV])
	} else

	// key level endorsement policy
	if function == "kepAddOrgs" {
		return s.kepAddOrgs(APIstub, args)
	} else if function == "kepDelOrgs" {
		return s.kepDelOrgs(APIstub, args)
	} else if function == "kepListOrgs" {
		return s.kepListOrgs(APIstub, args)
	} else if function == "delKEP" {
		return s.delKEP(APIstub, args)
	} else

	// private data
	if function == "uploadPOWithPrivate" {
		return s.uploadPOWithPrivate(APIstub, args)
	} else if function == "queryPOPublic" {
		return s.queryPOPublic(APIstub, args)
	} else if function == "queryPOPrivate" {
		return s.queryPOPrivate(APIstub, args)
	}

	return s.returnError("Invalid Smart Contract function name.")
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {
	factory.InitFactories(nil)

	// Create a new Smart Contract
	err := shim.Start(&SmartContract{factory.GetDefault()})
	if err != nil {
		logger.Errorf("Error creating new Smart Contract: %s", err)
	}
}
