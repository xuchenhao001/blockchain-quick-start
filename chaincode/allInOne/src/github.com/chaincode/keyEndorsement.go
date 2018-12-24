// Written by Xu Chen Hao
package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/statebased"
	sc "github.com/hyperledger/fabric/protos/peer"
)

func (s *SmartContract) kepAddOrgs(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) < 2 {
		return s.returnError("No orgs to add specified")
	}

	key := args[0]
	logger.Debug("Got key-level endorsement policy key: " + key)
	epKey, _ := stub.CreateCompositeKey("PO@", []string{key})

	// get the endorsement policy for the key
	epBytes, err := stub.GetStateValidationParameter(epKey)
	if err != nil {
		return s.returnError("Error get endorsement policy: " + err.Error())
	}
	ep, err := statebased.NewStateEP(epBytes)
	if err != nil {
		return s.returnError("Error generate new endorsement policy: " + err.Error())
	}

	// add organizations to endorsement policy
	err = ep.AddOrgs(statebased.RoleTypePeer, args[1:]...)
	if err != nil {
		return s.returnError("Error add organizations to endorsement policy: " + err.Error())
	}
	epBytes, err = ep.Policy()
	if err != nil {
		return s.returnError("Error generate endorsement policy bytes: " + err.Error())
	}

	// set the modified endorsement policy for the key
	err = stub.SetStateValidationParameter(epKey, epBytes)
	if err != nil {
		return s.returnError("Error set key level endorsement policy: " + err.Error())
	}

	return shim.Success(nil)
}


func (s *SmartContract) kepDelOrgs(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) < 2 {
		return s.returnError("No orgs to delete specified")
	}

	key := args[0]
	logger.Debug("Got key-level endorsement policy key: " + key)
	epKey, _ := stub.CreateCompositeKey("PO@", []string{key})

	// get the endorsement policy for the key
	epBytes, err := stub.GetStateValidationParameter(epKey)
	if err != nil {
		return s.returnError("Error get endorsement policy: " + err.Error())
	}
	ep, err := statebased.NewStateEP(epBytes)
	if err != nil {
		return s.returnError("Error generate new endorsement policy: " + err.Error())
	}

	// delete organizations from the endorsement policy of that key
	ep.DelOrgs(args[1:]...)
	epBytes, err = ep.Policy()
	if err != nil {
		return s.returnError("Error generate endorsement policy bytes: " + err.Error())
	}

	// set the modified endorsement policy for the key
	err = stub.SetStateValidationParameter(epKey, epBytes)
	if err != nil {
		return s.returnError("Error set key level endorsement policy: " + err.Error())
	}

	return shim.Success(nil)
}

// listOrgs returns the list of organizations currently part of
// the state's endorsement policy
func (s *SmartContract) kepListOrgs(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("No key specified or too many keys specified")
	}

	key := args[0]
	logger.Debug("Got key-level endorsement policy key: " + key)
	epKey, _ := stub.CreateCompositeKey("PO@", []string{key})

	// get the endorsement policy for the key
	epBytes, err := stub.GetStateValidationParameter(epKey)
	if err != nil {
		return s.returnError("Error get endorsement policy: " + err.Error())
	}
	ep, err := statebased.NewStateEP(epBytes)
	if err != nil {
		return s.returnError("Error generate new endorsement policy: " + err.Error())
	}

	// get the list of organizations in the endorsement policy
	orgs := ep.ListOrgs()
	orgsList, err := json.Marshal(orgs)
	if err != nil {
		return s.returnError("Error marshal orgs json: " + err.Error())
	}

	return shim.Success(orgsList)
}

// delEP deletes the state-based endorsement policy for the key altogether
func (s *SmartContract) delKEP(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("No key specified or too many keys specified")
	}

	key := args[0]
	logger.Debug("Got key-level endorsement policy key: " + key)
	epKey, _ := stub.CreateCompositeKey("PO@", []string{key})

	// set the modified endorsement policy for the key to nil
	err := stub.SetStateValidationParameter(epKey, nil)
	if err != nil {
		return s.returnError("Error set key level endorsement policy: " + err.Error())
	}

	return shim.Success(nil)
}
